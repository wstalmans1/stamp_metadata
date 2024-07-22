'use client'
import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { ChakraProvider, Button, Flex, Heading } from '@chakra-ui/react'
import { Image, SimpleGrid, Tooltip } from '@chakra-ui/react'
import { GITCOIN_PASSPORT_WEIGHTS } from './stamp-weights';



const APIKEY = process.env.NEXT_PUBLIC_GC_API_KEY
const headers = APIKEY ? ({
  'Content-Type': 'application/json',
  'X-API-Key': APIKEY
}) : undefined

declare global {
  interface Window {
    ethereum?: any
  }
}

interface Stamp {
  id: number
  stamp: string
  icon: string
}

export default function Passport() {
  // here we deal with any local state we need to manage
  const [address, setAddress] = useState<string>('')
  const [showStamps, setShowStamps] = useState<boolean>(false)
  const [stampArray, setStampArray] = useState<Array<Stamp>>([])
  const [score, setScore] = useState<number>()
  const [showScore, setShowScore] = useState<boolean>(false)
  const [customScore, setCustomScore] = useState<number>()
  const [showCustomScore, setShowCustomScore] = useState<boolean>(false)

  useEffect(() => {
    setShowStamps(false)
    checkConnection()
    async function checkConnection() {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const accounts = await provider.listAccounts()
        // if the user is connected, set their account
        if (accounts && accounts[0]) {
          setAddress(accounts[0].address)
        }
      } catch (err) {
        console.log('not connected...')
      }
    }
  }, [])

  async function connect() {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      setAddress(accounts[0])
    } catch (err) {
      console.log('error connecting...')
    }
  }

  async function getStamps() {
    const stampDataArray = [];
    const GET_PASSPORT_STAMPS_URI = `https://api.scorer.gitcoin.co/registry/stamps/${address}?include_metadata=true`;
    try {
      const response: Response = await fetch(GET_PASSPORT_STAMPS_URI, { headers });
      const data = await response.json();
      console.log('Raw API response:', data);
      // parse stamp data from json
      let counter = 0;
      for (const i of data.items) {
        if (i.credential?.credentialSubject?.provider && i.metadata?.platform?.icon) {
          let st = {
            id: counter,
            stamp: i.credential.credentialSubject.provider,
            icon: i.metadata.platform.icon
          };
          stampDataArray.push(st);
          counter += 1;
        } else {
          console.log('Skipping stamp due to missing data:', i);
        }
      }
      setStampArray(stampDataArray);
      setShowStamps(true);
    } catch (err) {
      console.log('error: ', err);
    }
  }

  const StampCollection = () => {
    return (
      <SimpleGrid minChildWidth='120px' spacing='40px' border='black'>
        <>
          {stampArray.map(s => <Tooltip key={s.id} label={s.stamp}><Image src={s.icon} alt={s.stamp} borderRadius='90px' boxSize='80px' fallbackSrc='gtc-logo.svg' backgroundColor='#C3D3D5' /></Tooltip>)}
        </>
      </SimpleGrid >
    )
  }

  function calculateGitcoinScore() {
    let i = 0
    var scores: Array<number> = []
    var score = 0;
    while (i < stampArray.length) {
      let id = stampArray[i].stamp
      if (GITCOIN_PASSPORT_WEIGHTS.hasOwnProperty(id)) {
        try {
          let temp_score = GITCOIN_PASSPORT_WEIGHTS[id]
          scores.push(parseFloat(temp_score.toString()))
        } catch {
          console.log("element cannot be added to cumulative score")
        }
      }
      i++;
    }
    for (let i = 0; i < scores.length; i++) {
      score += scores[i]
    }
    setShowScore(true)
    setScore(score)
  }

  const Score = () => {
    return (
        <>
        <p> Your score is {score}</p>
        </>
    )
  }

  function calculateCustomScore() {
    let i = 0
    var scores: Array<number> = []
    var score = 0;
    while (i < stampArray.length) {
      let id = stampArray[i].stamp
      if (GITCOIN_PASSPORT_WEIGHTS.hasOwnProperty(id)) {
        try {
          let temp_score = GITCOIN_PASSPORT_WEIGHTS[id]
          scores.push(parseFloat(temp_score.toString()))
        } catch {
          console.log("element cannot be added to cumulative score")
        }
      }
      i++;
    }
    for (let i = 0; i < scores.length; i++) {
      score += scores[i]
    }
    const mean = score / stampArray.length
    setShowCustomScore(true)
    setCustomScore(mean)
  }

  const CustomScore = () => {
    return (
        <>
        <p> Your custom score is {customScore}</p>
        </>
    )
  }  

  const styles = {
    main: {
      width: '900px',
      margin: '0 auto',
      paddingTop: 90
    }
  }

  return (
    /* this is the UI for the app */
    <div style={styles.main}>
      <ChakraProvider >
        <Flex minWidth='max-content' alignItems='right' gap='2' justifyContent='right'>
          <Button colorScheme='teal' variant='outline' onClick={connect}>Connect Wallet</Button>
          <Button colorScheme='teal' variant='outline' onClick={getStamps}>Show Stamps</Button>
          <Button colorScheme='teal' variant='outline' onClick={calculateGitcoinScore}>Get Score</Button>
          <Button colorScheme='teal' variant='outline' onClick={calculateCustomScore}>Get Custom Score</Button>
        </Flex>
        <br />
        <br />
        <Heading as='h1' size='4xl' noOfLines={2}>Gitcoin Stamp Collector</Heading>
        <br />
        <br />
        <br />
        {showStamps && <StampCollection />}
        <br />
        <br />
        <br />
        {showScore && <Score />}
        <br />
        <br />
        <br />
        {showCustomScore && <CustomScore />}
      </ChakraProvider >
    </div >
  )
}