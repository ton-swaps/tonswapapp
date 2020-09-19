<template>
  <b-container>
    <b-row class="mb-4">
    <b-col sm=12>
      <b-card
        border-variant="primary"
        header="MY ORDERS"
        header-bg-variant="primary"
        header-text-variant="white"
        align="center"
      >
      <b-card-text v-if="loading || (!loading && orders.length === 0)">
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" v-if="loading"></span>
        <span v-if="!loading && orders.length === 0">There are no orders yet</span>
      </b-card-text>
      <div v-if="!loading">
        <b-button :disabled="freshing" class="btn-primary float-left mb-2" variant="primary" @click="updateOrders">Refresh</b-button>
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
          <b-button size="sm" :disabled="!isClosePossible(row.item)" @click="close(row.item, row.index)" class="mr-1 mb-1">
            Close
          </b-button>
          <b-button size="sm" @click="row.toggleDetails">
            {{ row.detailsShowing ? 'Hide' : 'Show' }} Info
          </b-button>
        </template>

        <template v-slot:row-details="row">
          <b-card class="text-sm-left">
              <div v-for="(value, key) in row.item.info" :key="key">{{ key }}: <span v-html="value"></span>
              <br>
              </div>
          </b-card>
        </template>

      </b-table>
      </b-card>
    </b-col>
  </b-row>
  </b-container>

</template>

<script>
export default {
  props: ['address'],
  data () {
    return {
      loading: true,
      freshing: false,
      fields: [
        { key: 'status', label: 'Status' },
        { key: 'amount', label: 'Amount Range' },
        { key: 'fromToken', label: 'From' },
        { key: 'toToken', label: 'To' },
        { key: 'rate', label: 'Exchange rate' },
        { key: 'lockedUntil', label: 'Locked Until' },
        { key: 'actions', label: 'Actions' }],
      orders: [],
      currentPage: 1,
      perPage: 10
    }
  },
  created () {
    this.updateOrders()
  },
  mounted () {
    console.log('MyOrders mounted')
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = undefined
    }
    this.updateOrders()
  },
  beforeDestroy () {
    console.log('MyOrders unmounted')
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = undefined
    }
  },
  computed: {
    rows () {
      return this.orders.length
    }
  },
  methods: {
    updateOrders () {
      this.freshing = true
      setTimeout(() => {
        const list = this.$swapOrderbook.ordersWatcher.getOrders()
        const newlist = []
        for (const i in list) {
          const order = list[i]
          if (order.order !== undefined) {
            const altToken = order.order.direct ? order.order.toToken : order.order.fromToken
            console.log('order:', order)
            const c = {
              status: order.status,
              rate: this.$options.filters.formatAltHex(order.order.exchangeRate, altToken),
              fromToken: order.order.fromToken,
              toToken: order.order.toToken,
              lockedUntil: order.tonWithdrawUntil !== undefined ? this.$options.filters.formatTime(order.tonWithdrawUntil) : 'Wait for confirmation',
              order: order,
              info: {
                Secret: order.secret,
                'Secret hash': order.order.secretHash,
                'Confirmation time': this.$options.filters.formatTime(order.confirmedTm)
              }
            }
            if (order.order.confirmed) {
              c.amount = this.$options.filters.formatTonHex(order.order.value)
            } else {
              if (order.order.direct) {
                c.amount = order.order.value === order.order.minValue ? this.$options.filters.formatTonHex(order.order.value) : this.$options.filters.formatTonHex(order.order.minValue) + ' - ' + this.$options.filters.formatTonHex(order.order.value)
              } else {
                c.amount = order.order.foreignValue === order.order.foreignMinValue ? this.$options.filters.formatAltHex(order.order.foreignValue, altToken) : this.$options.filters.formatAltHex(order.order.foreignMinValue, altToken) + ' - ' + this.$options.filters.formatAltHex(order.order.foreignValue, altToken)
              }
            }
            if (order.altCreateUntil) {
              c.info[altToken + ' order creation until time'] = this.$options.filters.formatTime(order.altCreateUntil)
            }
            if (order.altWithdrawUntil) {
              c.info[altToken + ' order withdraw until time'] = this.$options.filters.formatTime(order.altWithdrawUntil)
            }
            if (order.tonWithdrawUntil) {
              c.info['TON order withdraw until time'] = this.$options.filters.formatTime(order.tonWithdrawUntil)
            }

            if (order.tonCreateTxId) {
              c.info['TON order create TXID'] = this.$options.filters.makeTxLink(order.tonCreateTxId, 'TON CRYSTAL')
              c.info['TON order create time'] = this.$options.filters.formatTime(order.tonCreateTxTm)
            }
            if (order.tonConfirmTxId) {
              c.info['TON order confirm TXID'] = this.$options.filters.makeTxLink(order.tonConfirmTxId, 'TON CRYSTAL')
              c.info['TON order confirm time'] = this.$options.filters.formatTime(order.tonConfirmTxTm)
            }
            if (order.altApproveTxId) {
              c.info[altToken + ' order approve TXID'] = this.$options.filters.makeTxLink(order.altApproveTxId, altToken)
              c.info[altToken + ' order approve time'] = this.$options.filters.formatTime(order.altApproveTxTm)
            }
            if (order.altTxId) {
              c.info[altToken + ' order create TXID'] = this.$options.filters.makeTxLink(order.altTxId, altToken)
              c.info[altToken + ' order create time'] = this.$options.filters.formatTime(order.altTxTm)
            }
            if (order.altFinishTxId) {
              c.info[altToken + ' order withdraw TXID'] = this.$options.filters.makeTxLink(order.altFinishTxId, altToken)
              c.info[altToken + ' order withdraw time'] = this.$options.filters.formatTime(order.altFinishTxTm)
            }
            if (order.tonFinishTxId) {
              c.info['TON order withdraw TXID'] = this.$options.filters.makeTxLink(order.tonFinishTxId, 'TON CRYSTAL')
              c.info['TON order withdraw time'] = this.$options.filters.formatTime(order.tonFinishTxTm)
            }

            for (const j in this.orders) {
              if (this.orders[j].order &&
                this.orders[j].order.order.secretHash !== undefined &&
                c.order.order.secretHash !== undefined &&
                this.orders[j].order.order.secretHash.toLowerCase() === c.order.order.secretHash.toLowerCase()) {
                c._showDetails = this.orders[j]._showDetails
                break
              }
            }
            // console.log('c:', c)
            newlist.push(c)
          } else {
            const c = {
              status: order.status,
              rate: '',
              fromToken: '',
              toToken: '',
              lockedUntil: ''
            }
            // console.log('c:', c)
            newlist.push(c)
          }
        }
        this.orders = newlist.reverse()
        this.freshing = false
        // this.currentPage = 1
        this.loading = false
        this.timer = setTimeout(this.updateOrders, 10000)
      }, 0)
    },
    close (order, index) {
      console.log('close', order, index)
      const seed = prompt('Enter a Free TON wallet seed phrase')
      this.$swapOrderbook.closeOrder(order.order.order, seed)
        .then((res) => {
          this.updateOrders()
        })
      // this.$emit('closeOrder', order)
    },
    isClosePossible (order) {
      return order.status === 'created'
    }
    /*,
    createOrder () {
      this.$emit('createOrder', 'TON CRYSTAL', this.token)
    },
    createOrderReversed () {
      this.$emit('createOrder', this.token, 'TON CRYSTAL')
    },
    swap (order, index) {
      console.log('swap', order, index)
      this.$emit('confirmOrder', order)
    } */
  }
}
</script>

<style scoped>

</style>
