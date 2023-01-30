import React from "react";
import logo from "./logo.svg";
import "./App.css";

import {
  Address,
  Value,
  BigNum,
  LinearFee,
  TransactionBuilderConfigBuilder,
  TransactionUnspentOutputs,
  TransactionUnspentOutput,
  TransactionBuilder,
  TransactionWitnessSet,
  Transaction,
  TransactionOutput,
  CoinSelectionStrategyCIP2,
} from "@emurgo/cardano-serialization-lib-asmjs";

declare global {
  interface Window {
    cardano: any;
  }
}

const App = () => {
  const connectToWallet = () => {
    const wallet = window.cardano["nami"].enable();
    wallet.getChangeAddress().then((address: string) => {
      // To be replaced with tool wallet
      const applicationWallet_receiveAddr =
        "addr_test1qzgghu3eqyl5y0lzchquh27l2c7yd7nd5tc946c55rnh3h60v0slwywee7kshqze52vqj2q2v04qd08jde54sx0dccdq22wk4f";
      const cert_fee_ada = 3;
      const cert_fee_lovelace = BigNum.from_str(
        (cert_fee_ada * 1000000).toString()
      );

      const protocolParams: any = {
        linearFee: {
          minFeeA: "440",
          minFeeB: "175381",
        },
        minUtxo: "34482",
        poolDeposit: "500000000",
        keyDeposit: "2000000",
        maxValSize: 5000,
        maxTxSize: 16384,
        priceMem: 0.0577,
        priceStep: 0.0000721,
        // minFeeCoefficient: 44,
        // minFeeConstant: 155_381,
        coinsPerUtxoByte: "4310",
      };

      let linearFee = LinearFee.new(
        BigNum.from_str(protocolParams.linearFee.minFeeA),
        BigNum.from_str(protocolParams.linearFee.minFeeB)
      );
      let txnBuilderConfigBuilder = TransactionBuilderConfigBuilder.new()
        .fee_algo(linearFee)
        .coins_per_utxo_byte(BigNum.from_str(protocolParams.coinsPerUtxoByte))
        .key_deposit(BigNum.from_str(protocolParams.keyDeposit))
        .pool_deposit(BigNum.from_str(protocolParams.poolDeposit))
        .max_value_size(protocolParams.maxValSize)
        .max_tx_size(protocolParams.maxTxSize);

      let txBuilder = TransactionBuilder.new(txnBuilderConfigBuilder.build());

      wallet.getUtxos().then((utxos: any) => {
        let txnUnspentOutputs = TransactionUnspentOutputs.new();
        utxos.forEach((utxo: any) => {
          txnUnspentOutputs.add(TransactionUnspentOutput.from_hex(utxo));
        });
        txBuilder.add_output(
          TransactionOutput.new(
            Address.from_bech32(applicationWallet_receiveAddr),
            Value.new(cert_fee_lovelace)
          )
        );
        txBuilder.add_inputs_from(
          txnUnspentOutputs,
          CoinSelectionStrategyCIP2.LargestFirst
        );
        txBuilder.add_change_if_needed(Address.from_hex(address));

        const encodedTx = Buffer.from(txBuilder.build_tx().to_bytes()).toString(
          "hex"
        );
        wallet.signTx(encodedTx).then((signed: string) => {
          const txVkeyWitnesses = TransactionWitnessSet.from_bytes(
            Buffer.from(signed, "hex")
          );
          const txSigned = Transaction.new(txBuilder.build(), txVkeyWitnesses);
          const encodedSignedTx = Buffer.from(txSigned.to_bytes()).toString(
            "hex"
          );
          wallet.submitTx(encodedSignedTx).then((txnId: string) => {
            console.log(" transaction id - ", txnId);
            alert("successful transaction");
          });
        });
      });
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h2 style={{color: "red"}}>** Do not use this tool - only for test purposes</h2>
        <p>Perform a sample transaction from Nami wallet</p>
        <button onClick={(_) => connectToWallet()}>Connect Wallet</button>
      </header>
    </div>
  );
};

export default App;
