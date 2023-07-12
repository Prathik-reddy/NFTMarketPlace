import { ethers } from 'ethers'
import Web3Modal from 'web3modal'
import { useEffect, useState } from 'react'
import axios from 'axios'
import styles from '../styles/Home.module.css';
import { Bars } from 'react-loading-icons'

import {
    nftaddress, nftmarketaddress
} from '../config'

import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import NFTMarket from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'

export default function MyAssets() {
    const [nfts, setNfts] = useState([])
    const [loadingState, setLoadingState] = useState('not-loaded')
    useEffect(() => {
        loadNFTs()
    }, [])

    async function loadNFTs() {

        const web3Modal = new Web3Modal()
        const connection = await web3Modal.connect()
        const provider = new ethers.providers.Web3Provider(connection)
        const signer = provider.getSigner()


        const marketContract = new ethers.Contract(nftmarketaddress, NFTMarket.abi, signer)
        const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)

        const data = await marketContract.fetchMyNFTs()

        const items = await Promise.all(data.map(async i => {
            const tokenUri = await tokenContract.tokenURI(i.tokenId)
            const meta = await axios.get(tokenUri)
            let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
            let item = {
                price,
                tokenId: i.tokenId.toNumber(),
                seller: i.seller,
                owner: i.owner,
                image: meta.data.image,
                name: meta.data.name,

            }
            return item
        }))
        setNfts(items)
        setLoadingState('loaded')
    }
    if (loadingState === 'loaded' && !nfts.length) return (
        <h1 className="py-10 px-20 text-3xl">No assets owned</h1>
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
        )
    } else {
        return (
            <div className="flex justify-center">
                <div className="p-4">
                    <div className="grid grid-cols-4 gap-5 pt-6">
                        {
                            nfts.map((nft, i) => (
                                <div key={i} className="border shadow rounded-xl overflow-hidden">
                                    <img className={styles['nft-image']} src={nft.image} style={{ height: '300px' }}/>
                                    <div className="p-4 bg-black">
                                        <p className="text-white text-2xl">Name : {nft.name.charAt(0).toUpperCase() + nft.name.slice(1)}</p>
                                        <p className="text-xl font-bold text-white">
                                            Price : {nft.price} Eth
                                        </p>
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