<template>
  <b-container>
    <b-row class="mb-4">
    <b-col sm=12>
      <b-card
        border-variant="primary"
        :header="'BUY ' + token"
        header-bg-variant="primary"
        header-text-variant="white"
        align="center"
      >
      <b-card-text v-if="loading || (!loading && orders.length === 0)">
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" v-if="loading"></span>
        <span v-if="!loading && orders.length === 0">There are no orders yet</span>
      </b-card-text>
      <div v-if="logged">
        <b-button class="btn-primary float-left mb-2" variant="primary" @click="createOrder">Create order</b-button>
      </div>
      <b-pagination
        v-if="!loading && orders.length > perPage"
        v-model="currentPage"
        :total-rows="rows"
        :per-page="perPage"
        aria-controls="ordersTable"
        class="float-right"
      ></b-pagination>
      <b-table
        v-if="!loading && orders.length > 0"
        id="ordersTable"
        hover
        :items="orders"
        :fields="fields"
        :per-page="perPage"
        :current-page="currentPage"
      >
        <template v-slot:cell(actions)="row">
          <b-button size="sm" @click="swap(row.item, row.index)">
            Swap
          </b-button>
        </template>
      </b-table>
      </b-card>
    </b-col>
  </b-row>
  <b-row class="mb-4">
    <b-col sm=12>
      <b-card
        border-variant="primary"
        :header="'SELL ' + token"
        header-bg-variant="primary"
        header-text-variant="white"
        align="center"
      >
      <b-card-text v-if="loadingReversed || (!loadingReversed && ordersReversed.length === 0)">
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" v-if="loadingReversed"></span>
        <span v-if="!loadingReversed && ordersReversed.length === 0">There are no orders yet</span>
      </b-card-text>
      <div v-if="logged">
        <b-button class="btn-primary float-left mb-2" variant="primary" @click="createOrderReversed">Create order</b-button>
      </div>
      <b-pagination
        v-if="!loadingReversed && ordersReversed.length > perPage"
        v-model="currentPageReversed"
        :total-rows="rowsReversed"
        :per-page="perPage"
        aria-controls="ordersTableReversed"
        class="float-right"
      ></b-pagination>
      <b-table
        id="ordersTableReversed"
        v-if="!loadingReversed && ordersReversed.length > 0"
        hover
        :items="ordersReversed"
        :fields="fields"
        :per-page="perPage"
        :current-page="currentPageReversed"
      >
        <template v-slot:cell(actions)="row">
          <b-button v-if="logged" size="sm" @click="swap(row.item, row.index)">
            Swap
          </b-button>
        </template>
      </b-table>
    </b-card>
    </b-col>
  </b-row>
  </b-container>

</template>

<script>
export default {
  props: ['logged', 'token'],
  data () {
    return {
      loading: true,
      loadingReversed: true,
      fields: [
        { key: 'rate', label: 'Exchange Rate' },
        { key: 'amount', label: 'Amount Range' },
        { key: 'lockTime', label: 'Timelock (Hours)' },
        { key: 'actions', label: 'Actions' }],
      orders: [],
      ordersReversed: [],
      currentPage: 1,
      perPage: 6,
      currentPageReversed: 1
    }
  },
  mounted () {
    console.log('OrderList mounted')
    if (this.timerDirect) {
      clearTimeout(this.timerDirect)
      this.timerDirect = undefined
    }
    if (this.timerReversed) {
      clearTimeout(this.timerReversed)
      this.timerReversed = undefined
    }
    this.updateDirectOrderbook()
    this.updateReversedOrderbook()
  },
  beforeDestroy () {
    console.log('OrderList unmounted')
    if (this.timerDirect) {
      clearTimeout(this.timerDirect)
      this.timerDirect = undefined
    }
    if (this.timerReversed) {
      clearTimeout(this.timerReversed)
      this.timerReversed = undefined
    }
  },
  watch: {
    token (t) {
      this.loading = true
      this.loadingReversed = true
      if (this.timerDirect) {
        clearTimeout(this.timerDirect)
        this.timerDirect = undefined
      }
      if (this.timerReversed) {
        clearTimeout(this.timerReversed)
        this.timerReversed = undefined
      }
      this.updateDirectOrderbook()
      this.updateReversedOrderbook()
    }
  },
  computed: {
    rows () {
      return this.orders.length
    },
    rowsReversed () {
      return this.ordersReversed.length
    }
  },
  methods: {
    updateDirectOrderbook () {
      const token = this.token
      if (!this.$swapOrderbook.isInited()) {
        this.timerDirect = setTimeout(this.updateDirectOrderbook, 10000)
        return
      }
      this.$swapOrderbook.getOrders('TON CRYSTAL', this.token)
        .then((orders) => {
          if (this.token !== token) {
            return
          }
          console.log('getOrders:', orders)
          this.orders = []
          for (const i in orders) {
            const order = orders[i]
            const c = {
              rate: this.$options.filters.formatAltHex(order.exchangeRate, this.token),
              amount: order.value === order.minValue ? this.$options.filters.formatTonHex(order.value) : this.$options.filters.formatTonHex(order.minValue) + ' - ' + this.$options.filters.formatTonHex(order.value),
              lockTime: this.$options.filters.formatHour(order.timeLockSlot),
              order
            }
            this.orders.push(c)
          }
          // this.currentPage = 1
          this.loading = false
          this.timerDirect = setTimeout(this.updateDirectOrderbook, 30000)
        })
        .catch(e => {})
    },
    updateReversedOrderbook () {
      const token = this.token
      if (!this.$swapOrderbook.isInited()) {
        this.timerReversed = setTimeout(this.updateReversedOrderbook, 10000)
        return
      }
      this.$swapOrderbook.getOrders(this.token, 'TON CRYSTAL')
        .then((orders) => {
          if (this.token !== token) {
            return
          }
          console.log('getOrders:', orders)
          // this.ordersReversed = orders
          this.ordersReversed = []
          for (const i in orders) {
            const order = orders[i]
            const c = {
              rate: this.$options.filters.formatAltHex(order.exchangeRate, this.token),
              amount: order.foreignValue === order.foreignMinValue ? this.$options.filters.formatAltHex(order.foreignValue, this.token) : this.$options.filters.formatAltHex(order.foreignMinValue, this.token) + ' - ' + this.$options.filters.formatAltHex(order.foreignValue, this.token),
              lockTime: this.$options.filters.formatHour(order.timeLockSlot),
              order
            }
            this.ordersReversed.push(c)
          }
          // this.currentPageReversed = 1
          this.loadingReversed = false
          this.timerReversed = setTimeout(this.updateReversedOrderbook, 30000)
        })
        .catch(e => {})
    },
    createOrder () {
      this.$emit('createOrder', 'TON CRYSTAL', this.token)
    },
    createOrderReversed () {
      this.$emit('createOrder', this.token, 'TON CRYSTAL')
    },
    swap (order, index) {
      console.log('swap', order, index)
      this.$emit('confirmOrder', order.order)
    }
  }
}
</script>

<style scoped>

</style>
