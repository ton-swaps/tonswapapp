<template>
  <b-container>
    <b-row>
    <b-col sm=10 offset=1>
      <b-card
        border-variant="primary"
        header="Confirm order"
        header-bg-variant="primary"
        header-text-variant="white"
        align="center"
        :title="order.fromToken + ' to ' + order.toToken"
      >
        <b-alert variant="danger" :show="alert">{{alertMsg}}</b-alert>

        <b-form @submit="confirmOrder">

        <b-form-group id="input-group-1" :label="'You want to buy (' + order.fromToken + '):'" label-for="input-1">
          <b-form-input
            id="input-1"
            v-model="form.value"
            :max="foreignValue"
            :min="foreignMinValue"
            :step="amountStep()"
            type="number"
            required
            placeholder="Token amount"
          ></b-form-input>
        </b-form-group>

        <b-form-group id="input-group-2" :label="'Exchange rate (price of 1 TON CRYSTAL):'" label-for="input-2">
          <b-form-input
            id="input-2"
            v-model="exchangeRate"
            required
            readonly
          ></b-form-input>
        </b-form-group>

        <b-form-group id="input-group-3" :label="'You will pay (' + order.toToken + '):'" label-for="input-3">
          <b-form-input
            id="input-3"
            v-model="targetValue"
            readonly
          ></b-form-input>
        </b-form-group>

        <b-form-group
          id="input-group-4"
          :label="order.direct ?
            'Your ' + targetCurrency + ' source address:' :
            'Your ' + sourceCurrency + ' target address:'"
          label-for="input-4"
          v-if="order.altToken !== 'BTC'"
        >
          <b-form-input
            id="input-4"
            v-model="form.recipientAltAddress"
            required
          ></b-form-input>
        </b-form-group>

        <b-form-group
          id="input-group-4"
          :label="order.direct ?
            'Your ' + targetCurrency + ' source wallet seed phrase:' :
            'Your ' + sourceCurrency + ' target wallet seed phrase:'"
          label-for="input-4"
          v-if="order.altToken === 'BTC'"
        >
          <b-form-input
            id="input-4"
            v-model="form.recipientAltAddress"
            required
          ></b-form-input>
        </b-form-group>

        <b-form-group id="input-group-5" :label="'Timelock slot (funds will be blocked for a max of ' + maxLock + ' hours):'" label-for="input-5">
          <b-form-input
            id="input-5"
            v-model="lockTime"
            required
            readonly
          ></b-form-input>
        </b-form-group>

        <b-form-group id="input-group-7" label="Your Login Seed phrase:" label-for="input-7">
          <b-form-input
            id="input-7"
            v-model="form.seed"
            required
            placeholder="Enter Login Seed phrase"
          ></b-form-input>
        </b-form-group>

        <b-button
          variant="primary"
          :disabled="confirmInProgress"
          type="submit"
          >
          <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" v-if="confirmInProgress"></span>
          Confirm
        </b-button>
      </b-form>
    </b-card>
    </b-col>
  </b-row>
  </b-container>

</template>

<script>
export default {
  props: ['order', 'address', 'maxTonAmount'],
  data () {
    return {
      form: {
        seed: '',
        value: 0,
        recipientAltAddress: ''
      },
      sourceCurrency: '',
      targetCurrency: '',
      lockTime: 0,
      confirmInProgress: false,
      alert: false,
      alertMsg: ''
    }
  },
  created () {
    console.log('created', this.order)
    this.lockTime = this.$options.filters.formatHour(this.order.timeLockSlot, true) + ' Hour(s)'
    this.sourceCurrency = this.$swapOrderbook.translateToken(this.order.fromToken)
    this.targetCurrency = this.$swapOrderbook.translateToken(this.order.toToken)
  },
  mounted () {
    let altToken
    if (this.order.fromToken === 'TON CRYSTAL') {
      altToken = this.order.toToken
    } else {
      altToken = this.order.fromToken
    }
    if (altToken === 'ETH' || altToken === 'USDT') {
      this.$swapOrderbook.swappers.ETH.waitEthAddresses()
        .then((addresses) => {
          if (addresses[0] !== undefined && this.form.recipientAltAddress === '') {
            this.form.recipientAltAddress = addresses[0]
          }
        })
    }
  },
  computed: {
    foreignValue () {
      if (this.order.fromToken !== 'TON CRYSTAL') {
        return this.$altValue(this.order.foreignValue, this.order.fromToken)
      } else {
        return this.$tonValue(this.order.value)
      }
    },
    foreignMinValue () {
      if (this.order.fromToken !== 'TON CRYSTAL') {
        return this.$altValue(this.order.foreignMinValue, this.order.fromToken)
      } else {
        return this.$tonValue(this.order.minValue)
      }
    },
    targetValue () {
      if (this.order.fromToken === 'TON CRYSTAL') {
        return this.$options.filters.formatAlt(this.form.value * this.$altValue(this.order.exchangeRate, this.order.toToken), this.order.toToken)
      } else {
        return this.$options.filters.formatTon(this.form.value / this.$altValue(this.order.exchangeRate, this.order.fromToken))
      }
    },
    maxLock () {
      return this.$options.filters.formatHour(this.order.timeLockSlot)
    },
    exchangeRate () {
      console.log('rate', this.order.exchangeRate)
      return this.$options.filters.formatAltHex(this.order.exchangeRate, this.order.fromToken === 'TON CRYSTAL' ? this.order.toToken : this.order.fromToken)
    }
  },
  methods: {
    amountStep () {
      if (this.order.fromToken === 'TON CRYSTAL') {
        return '0.000000001'
      } else if (this.order.fromToken === 'BTC') {
        return '0.00000001'
      } else if (this.order.fromToken === 'ETH') {
        return '0.000000001' // actually ETH is divisible to 18 decimal places
      } else if (this.order.fromToken === 'USDT') {
        return '0.000001'
      }
      return '1'
    },
    confirmOrder (evt) {
      evt.preventDefault()
      this.confirmInProgress = true

      const _confirm = async () => {
        try {
          let tValue
          if (this.order.fromToken === 'TON CRYSTAL') {
            // const v = this.form.value * this.$altValue(this.order.exchangeRate, this.order.toToken)
            const v = this.form.value
            tValue = this.$convertValue('TON CRYSTAL', v)
          } else {
            const v = this.form.value / this.$altValue(this.order.exchangeRate, this.order.fromToken)
            if (v * 1000000000 > this.$BigInt(this.maxTonAmount)) {
              throw Error('Insufficient balance')
            }
            tValue = this.$convertValue('TON CRYSTAL', v)

            const foreignValue = await this.$swapOrderbook.getAltValue(tValue, this.order.exchangeRate)
            console.log('foreignValue', tValue, foreignValue, this.order.foreignValue, this.order.foreignMinValue)
          }
          const order = await this.$swapOrderbook.ordersWatcher.newOrder()
          await order.confirmOrder(
            this.order,
            tValue,
            this.form.recipientAltAddress,
            this.address,
            this.form.seed)
          const loginInfo = await this.$swapOrderbook.updateInfo()
          this.confirmInProgress = false
          this.$emit('orderConfirmed', loginInfo)
        } catch (e) {
          console.log('confirmOrder error', e)
          this.alertMsg = 'Failed to create order: ' + e.message.toString()
          this.alert = true
          await new Promise(resolve => setTimeout(resolve, 3000))
          this.alert = false
          this.alertMsg = ''
          this.confirmInProgress = false
        }
      }
      _confirm()
    }
  }
}
</script>

<style scoped>

</style>
