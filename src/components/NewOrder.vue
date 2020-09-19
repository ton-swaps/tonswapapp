<template>
  <b-container>
    <b-row>
    <b-col sm=10 offset=1>
      <b-card
        border-variant="primary"
        header="Create new order"
        header-bg-variant="primary"
        header-text-variant="white"
        align="center"
        :title="order.fromToken + ' to ' + order.toToken"
      >
        <b-alert variant="danger" :show="alert">{{alertMsg}}</b-alert>

        <b-form @submit="createOrder">

        <b-form-group id="input-group-1" :label="'Amount (' + order.fromToken + '):'" label-for="input-1">
          <b-form-input
            id="input-1"
            v-model="amount"
            :max="maxAmount()"
            :min="amountStep()"
            :step="amountStep()"
            type="number"
            required
            placeholder="Token amount"
          ></b-form-input>
        </b-form-group>

        <b-form-group id="input-group-2" :label="'Exchange rate (price of 1 TON CRYSTAL):'" label-for="input-2">
          <b-form-input
            id="input-2"
            v-model="form.rate"
            min="0.000000001"
            step="0.000000001"
            type="number"
            required
            :placeholder="'Price in ' + order.altToken + ' for 1 TON CRYSTAL'"
          ></b-form-input>
        </b-form-group>

        <b-form-group id="input-group-3" :label="'You will receive (' + order.toToken + '):'" label-for="input-3">
          <b-form-input
            id="input-3"
            v-model="targetAmount"
            readonly
          ></b-form-input>
        </b-form-group>

        <b-form-group
          id="input-group-4"
          :label="order.fromToken === 'TON CRYSTAL' ?
            'Your ' + targetCurrency + ' target address:' :
            'Your ' + sourceCurrency + ' source address:'"
          label-for="input-4"
          v-if="order.altToken !== 'BTC'"
        >
          <b-form-input
            id="input-4"
            v-model="form.initiatorAltAddress"
            required
          ></b-form-input>
        </b-form-group>

        <b-form-group
          id="input-group-4"
          :label="order.fromToken === 'TON CRYSTAL' ?
            'Your ' + targetCurrency + ' target wallet seed phrase:' :
            'Your ' + sourceCurrency + ' source wallet seed phrase:'"
          label-for="input-4"
          v-if="order.altToken === 'BTC'"
        >
          <b-form-input
            id="input-4"
            v-model="form.initiatorAltAddress"
            required
          ></b-form-input>
        </b-form-group>

        <b-form-group id="input-group-5" :label="'Timelock slot (funds will be blocked for a max of ' + maxLock + ' hours):'" label-for="input-5">
          <b-form-select
            id="input-5"
            v-model="form.timeSlot"
            :options="timeSlots"
            required
          ></b-form-select>
        </b-form-group>

        <b-form-group id="input-group-6" :label="'Minimum Amount (' + order.fromToken + '):'" label-for="input-6">
          <b-form-input
            id="input-6"
            v-model="form.minAmount"
            :max="Math.min(maxAmount(), amount)"
            :min="amountStep()"
            :step="amountStep()"
            type="number"
            required
            placeholder="Token amount"
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
          :disabled="createInProgress"
          type="submit"
          >
          <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" v-if="createInProgress"></span>
          Create
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
      amount: 0,
      form: {
        seed: '',
        minAmount: 0,
        timeSlot: '4 Hours',
        initiatorAltAddress: '',
        rate: 1
      },
      sourceCurrency: '',
      targetCurrency: '',
      timeSlots: ['1 Hour', '4 Hours', '12 Hours', '24 Hours', '48 Hours'],
      createInProgress: false,
      alert: false,
      alertMsg: ''
    }
  },
  created () {
    if (this.order.fromToken === 'TON CRYSTAL') {
      this.amount = this.maxTonAmount
      this.form.minAmount = this.maxTonAmount
    } else {
      this.amount = 0
      this.form.minAmount = 0
    }
    this.sourceCurrency = this.$swapOrderbook.translateToken(this.order.fromToken)
    this.targetCurrency = this.$swapOrderbook.translateToken(this.order.toToken)
    console.log('new order created')
  },
  mounted () {
    if (this.order.altToken === 'ETH' || this.order.altToken === 'USDT') {
      this.$swapOrderbook.swappers.ETH.waitEthAddresses()
        .then((addresses) => {
          if (addresses[0] !== undefined && this.form.initiatorAltAddress === '') {
            this.form.initiatorAltAddress = addresses[0]
          }
        })
    }
  },
  watch: {
    amount (amount) {
      this.form.minAmount = Math.min(this.form.minAmount, amount)
    }
  },
  computed: {
    targetAmount () {
      if (this.order.fromToken === 'TON CRYSTAL') {
        return this.amount * this.form.rate
      } else {
        return this.amount / this.form.rate
      }
    },
    maxLock () {
      return this.lockTime() * 3
    }
  },
  methods: {
    lockTime () {
      switch (this.form.timeSlot) {
        case '1 Hour': return 1
        case '4 Hours': return 4
        case '12 Hours': return 12
        case '24 Hours': return 24
        case '48 Hours': return 48
      }
    },
    maxAmount () {
      if (this.order.fromToken === 'TON CRYSTAL') {
        return this.maxTonAmount.toString()
      }
      return Number.MAX_VALUE.toString()
    },
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
    createOrder (evt) {
      evt.preventDefault()
      this.createInProgress = true

      const _create = async () => {
        try {
          const altToken = this.order.fromToken === 'TON CRYSTAL' ? this.order.toToken : this.order.fromToken
          const order = await this.$swapOrderbook.ordersWatcher.newOrder()
          await order.createOrder(
            this.order.fromToken,
            this.order.toToken,
            this.$convertRate(altToken, this.form.rate),
            this.$convertValue(this.order.fromToken, this.amount),
            this.$convertValue(this.order.fromToken, this.form.minAmount),
            this.lockTime() * 3600,
            this.$convertAltAddress(altToken, this.form.initiatorAltAddress),
            this.address,
            this.form.seed)
          const loginInfo = await this.$swapOrderbook.updateInfo()
          this.createInProgress = false
          this.$emit('orderCreated', loginInfo)
        } catch (e) {
          console.log('createOrder error', e)
          this.alertMsg = 'Failed to create order: ' + e.message.toString()
          this.alert = true
          await new Promise(resolve => setTimeout(resolve, 3000))
          this.alert = false
          this.alertMsg = ''
          this.createInProgress = false
        }
      }
      _create()
    }
  }
}
</script>

<style scoped>

</style>
