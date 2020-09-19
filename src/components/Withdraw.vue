<template>
  <b-container>
    <b-row>
    <b-col sm=8 offset=2>
      <b-card
        border-variant="primary"
        header="Withdraw"
        header-bg-variant="primary"
        header-text-variant="white"
        align="center"
      >
        <b-alert variant="danger" :show="alert">{{alertMsg}}</b-alert>

        <b-form @submit="withdraw">
        <b-form-group
          id="input-group-1"
          label="Your Free TON address:"
          label-for="input-1"
        >
          <b-form-input
            id="input-1"
            v-model="address"
            required
            readonly
          ></b-form-input>
        </b-form-group>

        <b-form-group id="input-group-3" label="Amount:" label-for="input-3">
          <b-form-input
            id="input-3"
            v-model="form.amount"
            :max="maxAmount"
            min="0.000000001"
            step="0.000000001"
            type="number"
            required
            placeholder="Token amount"
          ></b-form-input>
        </b-form-group>

        <b-form-group id="input-group-2" label="Your Seed phrase:" label-for="input-2">
          <b-form-input
            id="input-2"
            v-model="form.seed"
            required
            placeholder="Enter Seed phrase"
          ></b-form-input>
        </b-form-group>

        <b-button
          variant="primary"
          :disabled="withdrawInProgress"
          type="submit"
          >
          <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" v-if="withdrawInProgress"></span>
          Withdraw
        </b-button>
      </b-form>
    </b-card>
    </b-col>
  </b-row>
  </b-container>

</template>

<script>
export default {
  props: ['maxAmount', 'address'],
  data () {
    return {
      form: {
        seed: '',
        amount: 0
      },
      withdrawInProgress: false,
      alert: false,
      alertMsg: ''
    }
  },
  methods: {
    withdraw (evt) {
      evt.preventDefault()
      this.withdrawInProgress = true

      const _withdraw = async () => {
        try {
          await this.$swapOrderbook.withdraw(this.form.amount * 1000000000, this.form.seed)
          const loginInfo = await this.$swapOrderbook.updateInfo()
          this.withdrawInProgress = false
          this.$emit('withdrawn', loginInfo)
          return
        } catch (e) {
          console.log('withdraw error', e)
          this.alertMsg = 'Failed to withdraw: ' + e.message.toString()
          this.alert = true
          await new Promise(resolve => setTimeout(resolve, 3000))
          this.alert = false
          this.alertMsg = ''
          this.withdrawInProgress = false
        }
      }
      _withdraw()
    }
  }
}
</script>

<style scoped>

</style>
