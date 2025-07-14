"use client";
import { useState, useEffect } from "react";
import Web3 from "web3";

const NavBar = () => {
  const [account, setAccount] = useState(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const web3 = new Web3(window.ethereum);
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setAccount(accounts[0]);
      } catch (error) {
        console.error("Error connecting to MetaMask", error);
      }
    } else {
      alert("Please install MetaMask");
    }
  };

  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <a href="/" className="text-white text-2xl font-bold">
          BlockChainEcom
        </a>
        <div className="space-x-4">
          <a href="/" className="text-gray-300 hover:text-white">
            Home
          </a>
          <a href="/cart" className="text-gray-300 hover:text-white">
            Cart
          </a>
        </div>
        <button
          onClick={connectWallet}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {account
            ? `${account.substring(0, 6)}...${account.substring(
                account.length - 4
              )}`
            : "Connect Wallet"}
        </button>
      </div>
    </nav>
  );
};

export default NavBar;
