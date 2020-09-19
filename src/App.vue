<template>
  <div id="app">

  <b-alert id="alert" :show="alert">Swap operation in progress, please do not close this tab</b-alert>

  <b-navbar id="navbar" :class="[ isLogged ? '' : 'mb-20' ]" toggleable="sm" type="dark" variant="primary" sticky>
    <b-navbar-brand href="#">Free TON Atomic Swaps <sup>demo</sup></b-navbar-brand>

    <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

    <b-collapse id="nav-collapse" is-nav>
      <b-navbar-nav class="ml-auto" right>
        <b-nav-item href="#" @click="eth" :active="tab === 'eth'">ETH</b-nav-item>
        <b-nav-item href="#" @click="usdt" :active="tab === 'usdt'">USDT</b-nav-item>
        <b-nav-item href="#" @click="btc" :active="tab === 'btc'">BTC</b-nav-item>
        <b-nav-item href="#" @click="orders" v-if="isLogged" :active="tab === 'orders'">ORDERS</b-nav-item>
        <b-nav-item href="#" @click="login" v-if="!isLogged" :active="tab === 'login'">LOGIN</b-nav-item>
        <b-nav-item href="#" @click="logout" v-if="isLogged">LOGOUT</b-nav-item>
      </b-navbar-nav>
    </b-collapse>
  </b-navbar>

  <b-navbar v-if="isLogged" class="mb-20" id="navbar" toggleable="sm" type="dark" variant="light" sticky>
    <span class="mr-2">
      Free: {{balance.freeFunds | formatTonHex}}
    </span>
    <span class=" ml-2 mr-2">
      In Orders: {{balance.ordersFunds | formatTonHex}}
    </span>
    <span class=" ml-2 mr-2">
      Locked: {{balance.lockedFunds | formatTonHex}}
    </span>
    <b-navbar-nav class="ml-auto" right>
        <b-button class="ml-2" href="#" variant="primary" @click="deposit" left>Deposit</b-button>
        <b-button class="ml-2" href="#" variant="primary" @click="withdraw" left :disabled="balance.freeFunds === '0x0'">Withdraw</b-button>
      </b-navbar-nav>
  </b-navbar>

  <span class="border">

  </span>

  <Login
    v-if="tab === 'login'"
    v-on:logged="logged"
  />

  <Withdraw
    v-if="tab === 'withdraw'"
    v-on:withdrawn="withdrawn"
    :address="address"
    :maxAmount="balance.freeFunds"
  />

  <Deposit
    v-if="tab === 'deposit'"
    v-on:deposited="deposited"
    :address="address"
    :depositAddress="depositAddress"
  />

  <NewOrder
    v-if="tab === 'newOrder'"
    v-on:orderCreated="orderCreated"
    :address="address"
    :maxTonAmount="balance.freeFunds"
    :order="newOrder"
  />

  <ConfirmOrder
    v-if="tab === 'confirmOrder'"
    v-on:orderConfirmed="orderConfirmed"
    :address="address"
    :maxTonAmount="balance.freeFunds"
    :order="newOrderConfirm"
  />

  <OrderList
    v-if="tab === 'eth' || tab === 'usdt' || tab === 'btc'"
    :logged="isLogged"
    :token="orderList.token"
    v-on:createOrder="createOrder"
    v-on:confirmOrder="confirmOrder"
  />

  <MyOrders
    v-if="tab === 'orders'"
    :address="address"
  />

  <!--
  <footer id="footer" class="py-4 bg-dark text-white-50 mt-auto">
    <div class="container text-center">
      <small>Copyright &copy;</small>
    </div>
  </footer>
  -->
  </div>
</template>

<script>
import Login from './components/Login.vue'
import Withdraw from './components/Withdraw.vue'
import Deposit from './components/Deposit.vue'
import NewOrder from './components/NewOrder.vue'
import ConfirmOrder from './components/ConfirmOrder.vue'
import OrderList from './components/OrderList.vue'
import MyOrders from './components/MyOrders.vue'

export default {
  name: 'App',
  components: {
    Login,
    Withdraw,
    Deposit,
    NewOrder,
    ConfirmOrder,
    OrderList,
    MyOrders
  },
  data () {
    return {
      alert: false,
      isLogged: false,
      address: '',
      seed: '',
      balance: {
        freeFunds: '0x0',
        ordersFunds: '0x0',
        lockedFunds: '0x0'
      },
      newOrder: {
        fromToken: '',
        toToken: '',
        altToken: '',
        sourceCurrency: '',
        targetCurrency: ''
      },
      orderList: {
        token: 'USDT'
      },
      newOrderConfirm: {},
      depositAddress: '0:d0032ed616eac41c8a5924c00e64e18b5083316e888bb9b5b34c4e32a9365f1d',
      tab: 'usdt'
    }
  },
  mounted () {
    this.$swapOrderbook.init()
      .then(() => {
        const checkBalance = async () => {
          while (true) {
            if (this.isLogged) {
              if (!this.$swapOrderbook.ordersWatcher.isInited()) {
                this.$swapOrderbook.ordersWatcher.init(this.address, this.seed)
              }
              if (this.$swapOrderbook.ordersWatcher.isAnyActive()) {
                this.alert = true
              } else {
                this.alert = false
              }
              try {
                this.balance = await this.$swapOrderbook.updateInfo()
              } catch (e) {
                console.log('updateInfo error:', e)
              }
            }
            await new Promise(resolve => setTimeout(resolve, 20000))
          }
        }
        checkBalance()
      })
      .catch((e) => {
        console.log('init error:', e)
      })
  },
  methods: {
    login () {
      if (this.tab !== 'login') {
        this.tab = 'login'
      }
    },
    logout () {
      this.$swapOrderbook.logout()
      this.isLogged = false
      this.balance = {}
      if (this.tab !== 'eth' && this.tab !== 'usdt' && this.tab !== 'btc') {
        this.login()
      }
    },
    logged (info, address, seed) {
      this.isLogged = true
      this.balance = info
      this.address = address
      this.seed = seed
      console.log('login info:', info, address)
      if (!this.$swapOrderbook.ordersWatcher.isInited()) {
        this.$swapOrderbook.ordersWatcher.init(address, seed)
      }
      if (this.$swapOrderbook.ordersWatcher.isAnyActive()) {
        this.alert = true
      } else {
        this.alert = false
      }
      this.usdt()
    },
    eth () {
      // this.createOrder('TON CRYSTAL', 'ETH')
      // this.createOrder('TON CRYSTAL', 'USDT')
      this.orderList.token = 'ETH'
      this.tab = 'eth'
    },
    usdt () {
      // this.createOrder('TON CRYSTAL', 'USDT')
      // this.createOrder('USDT', 'TON CRYSTAL')
      // this.$swapOrderbook.getOrder()
      //  .then((order) => {
      //    this.confirmOrder(order)
      //  })
      this.orderList.token = 'USDT'
      this.tab = 'usdt'
    },
    btc () {
      // this.createOrder('TON CRYSTAL', 'BTC')
      this.orderList.token = 'BTC'
      this.tab = 'btc'
    },
    orders () {
      this.tab = 'orders'
      console.log('orders')
    },
    deposit () {
      this.tab = 'deposit'
      console.log('deposit')
    },
    deposited (info) {
      this.balance = info
      this.usdt()
    },
    withdraw () {
      this.tab = 'withdraw'
      console.log('withdraw')
    },
    withdrawn (info) {
      this.balance = info
      this.usdt()
    },
    createOrder (from, to) {
      this.newOrder.fromToken = from
      this.newOrder.toToken = to
      if (from === 'TON CRYSTAL') {
        this.newOrder.altToken = to
      } else {
        this.newOrder.altToken = from
      }
      this.tab = 'newOrder'
    },
    orderCreated (info) {
      this.balance = info
      this.orders()
    },
    confirmOrder (order) {
      this.newOrderConfirm = order
      this.tab = 'confirmOrder'
    },
    orderConfirmed (info) {
      this.balance = info
      this.orders()
    }
  }
}
</script>

<style>
 /*
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
*/
#alert {
  text-align: center;
  margin-bottom: 0;
}

#footer {
  margin-top: 20px;
}
</style>
