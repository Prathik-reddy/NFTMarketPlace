import { useState } from "react";
import { ethers } from "ethers";
import { useRouter } from "next/router";
import Web3Modal from 'web3modal';
import { Web3Storage } from "web3.storage";
import { Bars } from 'react-loading-icons'

import { nftaddress, nftmarketaddress } from '../config.js';
import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import NFTMarket from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json";

const CreateItem = () => {
  const [fileUrl, setFileUrl] = useState(null);
  const [formInput, updateFormInput] = useState({ price: '', name: '', description: '' });

  const [loading, setLoading] = useState();

  const router = useRouter();
  const client = new Web3Storage({ token: process.env.WEB3_API_TOKEN });

  const onChange = async (e) => {
    setLoading(true);
    const file = e.target.files[0];
    const fileName = encodeURIComponent(file.name);
    let uploaded = 0;

    const onRootCidReady = (cid) => {
      console.log(`Uploading files with cid: ${cid}`);
    }

    const totalSize = file.size;
    console.log(totalSize);

    const onStoredChunk = (size) => {
      uploaded += size;
      const pct = 100 * (uploaded / totalSize);
      console.log(`Uploading ... ${pct.toFixed(0)}% complete`);
    }

    try {
      const cid = await client.put([file], { onRootCidReady, onStoredChunk });
      const url = `https://${cid}.ipfs.w3s.link/${fileName}`
      setFileUrl(url);
      setLoading(false);
    } catch (error) {
      console.log("Error uploading file, please try again: ", error);
      setLoading(false);
    }
  }

  const createSale = async (url) => {
    const web3modal = new Web3Modal();
    const connection = await web3modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const contract = new ethers.Contract(
      nftaddress,
      NFT.abi,
      signer
    );

    let transaction = await contract.createToken(url);
    let tx = await transaction.wait();
    let event = tx.events[0];
    console.log("event: ", event);
    let value = event.args[2];
    let tokenId = value.toNumber();

    const price = ethers.utils.parseUnits(formInput.price, 'ether');

    let contract2 = new ethers.Contract(
      nftmarketaddress,
      NFTMarket.abi,
      signer
    );

    let listingPrice = await contract2.getListingPrice();
    listingPrice = listingPrice.toString();

    transaction = await contract2.createMarketItem(nftaddress, tokenId, price, { value: listingPrice });
    await transaction.wait();
    router.push('/');

  }

  const createItem = async () => {
    const { name, description, price } = formInput;
    if (!name || !description || !price || !fileUrl) {
      alert("Pls enter all required fields")
      return;
    }

    const data = JSON.stringify({
      name,
      description,
      image: fileUrl
    });

    const blob = new Blob([data], { type: 'application/json' });
    console.log(blob);
    const jsonFile = new File([blob], 'meta.json');
    console.log(jsonFile);
    try {
      console.log('Uploading meta data file ...');
      const cid = await client.put([jsonFile]);
      console.log('Meta data file uploaded');
      const url = `https://${cid}.ipfs.w3s.link/meta.json`;
      await createSale(url);
    } catch (error) {
      console.error(error);
    }
  }


  return (
    <div className='flex justify-center'>
      <div className='w-1/2 flex flex-col pb-12'>
        <input
          placeholder='NFT name'
          className='mt-8 border rounded p-4'
          onChange={e => updateFormInput({
            ...formInput,
            name: e.target.value
          })}
        />
        <textarea
          placeholder='NFT Description'
          className='mt-2 border rounded p-4'
          onChange={e => updateFormInput({
            ...formInput,
            description: e.target.value
          })}
        />
        <input
          placeholder='NFT price in ETH'
          className='mt-2 border rounded p-4'
          onChange={e => updateFormInput({
            ...formInput,
            price: e.target.value
          })}
        />
        <input
          type='file'
          name='asset'
          className='my-3'
          onChange={onChange}

        />
        {
          fileUrl && (
            <img className='rounded my-4' width='350' src={fileUrl} />
          )
        }
        {
          !loading ? <button
            onClick={createItem} disabled={loading} className="text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:bg-gradient-to-l focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2">
            Create NFT
          </button> : <div
             className="flex justify-center text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:bg-gradient-to-l focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2 ">
            <Bars className="flex flex-center" height={30}/>
          </div>
        }

      </div>

    </div>
  );



}

export default CreateItem;