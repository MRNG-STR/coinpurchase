import React from 'react';
import $ from 'jquery';

export default class BTCTracker extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      accountBalance: 0.00,
      pendingTrxn: {
        trxn_type: '',
        status: '',
        price: ''
      },
      qty: '',
      set_price: '',
      trxn_type: '',
      coin_id: 'ethereum',
      coin_price: 0.00
    }
    this.handleqtyChange = this.handleqtyChange.bind(this);
    this.handlesetpriceChange = this.handlesetpriceChange.bind(this);
    
  }

  componentDidMount() {
    this.fetch();
    this.getDashboardbalance();
    this.getPendingTrxn();

  }
  handleqtyChange = (event) => {
    this.setState({ qty: event.target.value });
  }
  handlesetpriceChange = (event) => {
    this.setState({ set_price: event.target.value });
  }

  fetch() {
    var context = this;

    window.setTimeout(function () {
      $.ajax({
        url: "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=USD",
        dataType: "json",
        method: "GET",
        success: function (response) {
          console.log(response, "response")
          context.setState({
            coin_price: response.ethereum.usd,
          });
        }
      });
    }, 1000);
  }

  getDashboardbalance() {
    var context = this;
    window.setTimeout(function () {
      $.ajax({
        url: "http://localhost:3001/accountbalance",
        dataType: "json",
        method: "GET",
        success: function (response) {
          context.setState({
            accountBalance: response.response.acc_balance
          });
        }
      });
    }, 1000);
  }
  getPendingTrxn() {
    var context = this;
    window.setTimeout(function () {
      $.ajax({
        url: "http://localhost:3001/getqueuedRequest",
        dataType: "json",
        method: "GET",
        success: function (response) {
        if(response.status !== 404){
          context.setState({
            pendingTrxn: {
              trxn_type: response.response.trxn_type,
              status: response.response.status,
              price: response.response.set_price
            }
          });
        }
          
        }
      });
    }, 1000);
  }
  
  handleBuyClick() {
    const payload = {
      qty: this.state.qty,
      trxn_type: 'BUY',
      set_price: this.state.set_price,
      coin_id: this.state.coin_id,
      coin_price:this.state.coin_price
    }
    $.ajax({
      url: "http://localhost:3001/buycoin",
      dataType: "json",
      method: "POST",
      data: payload, 
      success : function (response) {
      }
    });

  }
  handleSellClick() {
    const payload = {
      qty: this.state.qty,
      trxn_type: 'SELL',
      set_price: this.state.set_price,
      coin_id: this.state.coin_id,
      coin_price:this.state.coin_price
    }
    $.ajax({
      url: "http://localhost:3001/sellcoin",
      dataType: "json",
      method: "POST",
      data: payload, 
      success : function (response) {
      }
    });

  }
  render() {
    return (
      <div>
        
        <form>
        <h1>
          Etherium Price: {this.state.coin_price}
        </h1><br></br>
        <h1>
          You Dashboard Balance: {this.state.accountBalance}
        </h1><br></br>
        <h1>
          Your Pending Request
        </h1>
        <label >Transaction type:{this.state.pendingTrxn.trxn_type}</label><br></br>
        <label >Status:{this.state.pendingTrxn.status}</label><br></br>
        <label >Price:{this.state.pendingTrxn.price}</label><br></br>
          <br></br>
          <h1>
            BUY / SELL
          </h1>
          <label>
            Quantity:
            <input type="number" value={this.state.qty} onChange={this.handleqtyChange} />
          </label><br></br><br></br>
          <label>
            Set Price:
            <input type="number" value={this.state.set_price} onChange={this.handlesetpriceChange} />
          </label><br></br><br></br>
          <button onClick={() => this.handleBuyClick()}>
            BUY
          </button>
          <button onClick={() => this.handleSellClick()}>
            SELL
          </button>
        </form>
      </div>

    );
  }
}