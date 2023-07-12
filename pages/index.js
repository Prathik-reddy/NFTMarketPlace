import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios, { HttpStatusCode } from 'axios'
import Web3Modal from 'web3modal'
import { nftaddress, nftmarketaddress } from '../config'
import { Bars } from 'react-loading-icons'

import NFT from "../artifacts/contracts/NFT.sol/NFT.json"
import NFTMarket from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json"

export default function Home() {
    const [nfts, setNFts] = useState([])
    const [loadingState, setLoadingState] = useState('not-loaded')

    useEffect(() => {
        loadNFTs()
    }, [])

    async function loadNFTs() {
        const provider = new ethers.providers.JsonRpcProvider("https://eth-sepolia.g.alchemy.com/v2/QdlUCpjgq9VhnFCF1EZBOwmYFZA1vbUd")
        const nftContract = new ethers.Contract(nftaddress, NFT.abi, provider)
        const nftMarketContract = new ethers.Contract(nftmarketaddress, NFTMarket.abi, provider)
        const data = await nftMarketContract.fetchMarketItems()

        const items = await Promise.all(data.map(async i => {
            const tokenUri = await nftContract.tokenURI(i.tokenId)
            const meta = await axios.get(tokenUri)
            let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
            let item = {
                price,
                tokenId: i.tokenId.toNumber(),
                seller: i.seller,
                owner: i.owner,
                image: meta.data.image,
                name: meta.data.name,
                description: meta.data.description
            }
            return item

        }))
        setNFts(items)
        setLoadingState("loaded");
    }


    async function buyNFT(nft, i) {
        loader(i,0);
        const web3Modal = new Web3Modal()
        const connection = await web3Modal.connect()
        const provider = new ethers.providers.Web3Provider(connection)
        const signer = provider.getSigner()

        const contract = new ethers.Contract(nftmarketaddress, NFTMarket.abi, signer)
        const price = ethers.utils.parseUnits(nft.price.toString(), 'ether')
        try {
            const transaction = await contract.createMarketSale(nftaddress, nft.tokenId, {
                value: price
            })
            await transaction.wait()
            loader(i,1);

        } catch (error) {
            loader(i,2)
            console.log(error);
        }
        loadNFTs()
    }

    async function loader(btnId,num) {
        let btn = document.getElementById(btnId);
        if(num == 0){
            btn.disabled=true;
            btn.innerText = "Buying"
        }else{
            btn.innerText = "Buy Nft"
        }
    }

    if (loadingState === "loaded" && !nfts.length)
        return (
            <div>
                <p className="px-10 py-10 text-2xl font-bold flex justify-center text-cyan-200">
                    There are currently no NFTs in the Marketplace.<br /> Please come back later
                </p>
            </div>
        )
    if (loadingState != "loaded") {
        return (
            <>
                <div className="flex justify-center">
                    <div className="block mx-auto my-5">
                        <Bars />
                    </div>
                </div>
            </>
        );
    } else {
        return (
            <div className="flex justify-center">
                <div className="container mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-5">
                        {
                            nfts.map((nft, i) => (
                                <div key={i} className="border shadow rounded-3xl overflow-hidden bg-slate-500">
                                    <img style={{ height: '250px' }} src={nft.image} />
                                    <div className="p-4 bg-gray-600">
                                        <p style={{ height: '64px' }} className="text-3xl text-white font-semibold">{nft.name.charAt(0).toUpperCase() + nft.name.slice(1)}</p>
                                        <div style={{ height: '70px', overflow: "hidden" }}>
                                            <p className="text-white text-2xl">{nft.description.charAt(0).toUpperCase() + nft.description.slice(1)}</p>
                                        </div>
                                        <div style={{ height: '70px', overflow: "hidden" }}>
                                            <p className="text-white text-2xl">Seller : {nft.seller.slice(0, 5) + "..." + nft.seller.slice(-4, nft.seller.length)}</p>
                                        </div>

                                    </div>

                                    <div className='p-4 bg-black'>
                                        <p className='text-2xl mb-4 font-bold text-white'>{nft.price} ETH</p>
                                        <button id={i} className="w-full flex justify-center text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:bg-gradient-to-l focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2" onClick={() => buyNFT(nft,i)}>Buy Nft</button>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>
        )
    }
}