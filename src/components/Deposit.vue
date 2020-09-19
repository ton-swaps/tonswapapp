<template>
  <b-container>
    <b-row>
    <b-col sm=8 offset=2>
      <b-card
        border-variant="primary"
        header="Deposit (1 TON CRYSTAL of fee will be charged)"
        header-bg-variant="primary"
        header-text-variant="white"
        align="center"
      >
        <b-alert variant="danger" :show="alert">{{alertMsg}}</b-alert>
        <!--
        <b-form-group
          id="input-group-1"
          label="Transfer your funds to the address:"
          label-for="input-1"
        >
        <b-form-textarea
            id="input-1"
            v-model="depositAddress"
            readonly
            rows="1"
            max-rows="3"
          ></b-form-textarea>
        </b-form-group>
        -->

        <b-form @submit="deposit">
        <b-form-group id="input-group-3" label="Amount:" label-for="input-3">
          <b-form-input
            id="input-3"
            v-model="form.amount"
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
          type="submit"
          :disabled="depositInProgress"
          >
          <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" v-if="depositInProgress"></span>
          Deposit
        </b-button>
      </b-form>

    </b-card>
    </b-col>
  </b-row>
  </b-container>

</template>

<script>
export default {
  props: ['depositAddress', 'address'],
  data () {
    return {
      depositInProgress: false,
      alert: false,
      alertMsg: '',
      form: {
        seed: '',
        amount: 0
      }
    }
  },
  methods: {
    deposit (evt) {
      evt.preventDefault()
      this.depositInProgress = true

      const _deposit = async () => {
        try {
          await this.$swapOrderbook.deposit(this.form.amount * 1000000000, this.form.seed)
          const loginInfo = await this.$swapOrderbook.updateInfo()
          this.depositInProgress = false
          this.$emit('deposited', loginInfo)
          return
        } catch (e) {
          console.log('deposit error', e)
          this.alertMsg = 'Failed to deposit: ' + e.message.toString()
          this.alert = true
          await new Promise(resolve => setTimeout(resolve, 3000))
          this.alert = false
          this.alertMsg = ''
          this.depositInProgress = false
        }
      }
      _deposit()
    }
  }
}
</script>

<style scoped>

</style>
