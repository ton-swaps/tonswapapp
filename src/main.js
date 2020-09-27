import Vue from 'vue'
import { BootstrapVue } from 'bootstrap-vue'
import App from './App.vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import { BigInteger } from 'javascript-biginteger'
import numeral from 'numeral'

import TonSwapOrderbook from 'tonswaplib'

Vue.prototype.$swapOrderbook = new TonSwapOrderbook('0:ee02be55dccc3ba1e7906120b635222f4c24127616c0f75ef7d30bb83b2f1a59')
Vue.prototype.$BigInt = BigInteger

Vue.use(BootstrapVue)
Vue.config.productionTip = false
Vue.filter('formatTon', function (value) {
  return numeral(value).format('0,0.00')
})
Vue.filter('formatTonHex', function (value) {
  value = BigInteger(value).quotient(1000000).toJSValue() / 1000
  return numeral(value).format('0,0.00')
})
Vue.filter('formatHour', function (value, slot = false) {
  if (slot) {
    value = parseInt(value, 16) / 3600
  } else {
    value = parseInt(value, 16) * 3 / 3600
  }
  return numeral(value).format('0.0')
})
Vue.filter('formatTime', function (value) {
  if (!value) {
    return ''
  }
  return new Date(value * 1000).toISOString().slice(-24, -5).replace('T', ' ') + ' UTC'
})
Vue.filter('makeTxLink', function (txid, token) {
  if (token === 'TON CRYSTAL') {
    return '<a href="https://net.ton.live/transactions?section=details&id=' + txid + '" >' + txid + '</a>'
  } else if (token === 'ETH' || token === 'USDT') {
    return '<a href="https://ropsten.etherscan.io/tx/' + txid + '" >' + txid + '</a>'
  } else if (token === 'BTC') {
    return '<a href="https://live.blockcypher.com/btc-testnet/tx/' + txid + '/" >' + txid + '</a>'
  }
  return txid
})
Vue.filter('formatAltHex', function (value, altToken) {
  if (altToken === 'ETH') {
    value = BigInteger(value).quotient(1000000000000).toJSValue() / 1000000
    return numeral(value).format('0,0.00000')
  } else if (altToken === 'USDT') {
    value = BigInteger(value).quotient(1000).toJSValue() / 1000
    return numeral(value).format('0,0.00')
  } else if (altToken === 'BTC') {
    value = BigInteger(value).toJSValue() / 100000000
    return numeral(value).format('0,0.0000000')
  }
  return '0'
})
Vue.filter('formatAlt', function (value, altToken) {
  if (altToken === 'ETH') {
    return numeral(value).format('0,0.00000')
  } else if (altToken === 'USDT') {
    return numeral(value).format('0,0.00')
  } else if (altToken === 'BTC') {
    return numeral(value).format('0,0.0000000')
  }
  return '0'
})

Vue.prototype.$altValue = (value, altToken) => {
  if (altToken === 'ETH') {
    return BigInteger(value).quotient(1000000000000).toJSValue() / 1000000
  } else if (altToken === 'USDT') {
    return BigInteger(value).quotient(1000).toJSValue() / 1000
  } else if (altToken === 'BTC') {
    return BigInteger(value).toJSValue() / 100000000
  }
  return 0
}

Vue.prototype.$tonValue = (value) => {
  return BigInteger(value).quotient(1000000).toJSValue() / 1000
}

Vue.prototype.$convertValue = (fromToken, value) => {
  if (fromToken === 'TON CRYSTAL') {
    // to nano
    return '0x' + BigInteger(value * 1000000000).toString(16)
  } else if (fromToken === 'ETH') {
    // to wei
    return '0x' + BigInteger(value * 1000000000).multiply(1000000000).toString(16)
  } else if (fromToken === 'USDT') {
    return '0x' + BigInteger(value * 1000000).toString(16)
  } else if (fromToken === 'BTC') {
    // to satoshi
    return '0x' + BigInteger(value * 100000000).toString(16)
  }
  return '0x0'
}

Vue.prototype.$convertRate = (altToken, rate) => {
  if (altToken === 'ETH') {
    // to wei
    return '0x' + BigInteger(rate * 1000000000).multiply(1000000000).toString(16)
  } else if (altToken === 'USDT') {
    return '0x' + BigInteger(rate * 1000000).toString(16)
  } else if (altToken === 'BTC') {
    // to satoshi
    return '0x' + BigInteger(rate * 100000000).toString(16)
  }
  return '0x0'
}

Vue.prototype.$convertAltAddress = (altToken, addr) => {
  if (altToken === 'ETH') {
    return addr
  } else if (altToken === 'USDT') {
    return addr
  } else if (altToken === 'BTC') {
    return addr
  }
  return '0x0'
}

new Vue({
  render: h => h(App)
}).$mount('#app')
