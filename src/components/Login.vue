<template>
  <b-container>
    <b-row>
    <b-col sm=8 offset=2>
      <b-card
        border-variant="primary"
        header="Login"
        header-bg-variant="primary"
        header-text-variant="white"
        align="center"
      >
        <b-alert variant="danger" :show="alert">{{alertMsg}}</b-alert>

        <b-form @submit="login">
        <b-form-group
          id="input-group-1"
          label="Your Free TON address:"
          label-for="input-1"
        >
          <b-form-input
            id="input-1"
            v-model="form.address"
            required
            placeholder="Enter Free TON address"
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
          :disabled="loginInProgress"
          type="submit"
          >
          <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" v-if="loginInProgress"></span>
          Login</b-button>
      </b-form>
    </b-card>
    </b-col>
  </b-row>
  </b-container>

</template>

<script>
export default {
  data () {
    return {
      form: {
        address: '',
        seed: ''
      },
      loginInProgress: false,
      alert: false,
      alertMsg: ''
    }
  },
  methods: {
    login (evt) {
      evt.preventDefault()

      this.loginInProgress = true

      const _login = async () => {
        try {
          await this.$swapOrderbook.login(this.form.address, this.form.seed)
          const loginInfo = await this.$swapOrderbook.updateInfo()
          this.loginInProgress = false
          this.$emit('logged', loginInfo, this.form.address, this.form.seed)
        } catch (e) {
          console.log('error', e)
          this.alertMsg = 'Failed to login: ' + e.message.toString()
          this.alert = true
          await new Promise(resolve => setTimeout(resolve, 3000))
          this.alert = false
          this.alertMsg = ''
          this.loginInProgress = false
        }
      }
      _login()
    }
  }
}
</script>

<style scoped>

</style>
