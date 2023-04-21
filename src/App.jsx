import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Image,
  Input,
  SimpleGrid,
  Text,
} from '@chakra-ui/react';
import { Alchemy, Network } from 'alchemy-sdk';
import { useState, useEffect } from 'react';

const ALCHEMY_KEY_ETH = import.meta.env.VITE_ALCHEMY_KEY_ETH;
const ALCHEMY_KEY_MUMBAI = import.meta.env.VITE_ALCHEMY_KEY_ETH;

const networks = ["GOERLI", "MUMBAI"];

function App() {
  const [userAddress, setUserAddress] = useState('');
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);
  const [alchemy, setAlchemy] = useState({});
  const [targetNetwork, setTargetNetwork] = useState(networks[0]);
  const [walletAddress, setWalletAddress] = useState("Not connected");

  useEffect(() => {
    updateProviderNetwork(targetNetwork);
  }, [targetNetwork]);

  function updateProviderNetwork(networkToGet) {
    let config = {};

    switch (networkToGet) {
      case networks[0]:
      default:
        config = {
          apiKey: ALCHEMY_KEY_ETH,
          network: Network.ETH_GOERLI,
        };
        break;
      case networks[1]:
        config = {
          apiKey: ALCHEMY_KEY_MUMBAI,
          network: Network.MATIC_MUMBAI,
        };
        break;
    }
    const alchemyTmp = new Alchemy(config);
    setAlchemy(alchemyTmp);
  }

  async function getNftMetadatas(nftData) {
    const tokenDataPromises = [];

    for (let i = 0; i < nftData.ownedNfts.length; i++) {
      const tokenData = alchemy.nft.getNftMetadata(
        nftData.ownedNfts[i].contract.address,
        nftData.ownedNfts[i].tokenId
      );
      tokenDataPromises.push(tokenData);
    }

    setTokenDataObjects(await Promise.all(tokenDataPromises));
  }

  async function getNFTsForOwner(userAddressToRequest) {
    setHasQueried(false);
    const data = await alchemy.nft.getNftsForOwner(userAddressToRequest);
    setResults(data);
    await getNftMetadatas(data);
    setHasQueried(true);
  }

  async function getNFTFromWallet() {
    if (window.ethereum) {
      try {
        const addressArray = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        if (addressArray.length > 0) {
          setWalletAddress(addressArray[0].slice(0, 5) + "..." + addressArray[0].slice(-5));
          await getNFTsForOwner(addressArray[0]);
        }
      } catch (err) {
        console.log(err);
      }
    } else {
      console.log("You should intall a wallet!");
    }
  }

  const handleRadioChange = (event) => {
    setTargetNetwork(event.target.value);
  };

  const renderRadioButtons = () => {
    return (
      <form style={{display:"flex", flexDirection: "row", justifyContent:"space-around", width:"20%"}}>
        <div className="radio">
          <label>
            <input type="radio" value={networks[0]} 
              checked={targetNetwork === networks[0]} 
              onChange={handleRadioChange} />
            Goerli
          </label>
        </div>
        <div className="radio">
          <label>
            <input type="radio" value={networks[1]} 
              checked={targetNetwork === networks[1]} 
              onChange={handleRadioChange} />
            Mumbai
          </label>
        </div>
      </form>
    );
  };

  return (
    <Box w="100vw">
      <Center>
        <Flex
          alignItems={'center'}
          justifyContent="center"
          flexDirection={'column'}
        >
          <Text>
            Wallet: {walletAddress}
          </Text>
          <Heading mb={0} fontSize={36}>
            NFT Indexer 🖼
          </Heading>
          <Text>
            Plug in an address and this website will return all of its NFTs!
          </Text>
        </Flex>
      </Center>
      <Flex
        w="100%"
        flexDirection="column"
        alignItems="center"
        justifyContent={'center'}
      >
        <Heading mt={42}>Get all the ERC-721 tokens of this address:</Heading>
        <Input
          onChange={(e) => setUserAddress(e.target.value)}
          color="black"
          w="600px"
          textAlign="center"
          p={4}
          bgColor="white"
          fontSize={24}
        />
        {renderRadioButtons()}
        <Flex
          flexDir={'row'}
        >
          <Button fontSize={20} onClick={() => getNFTsForOwner(userAddress)} mt={36} background={"#9494b8"}>
            Check ERC-20 Token Balances
          </Button>
          {/* fix here */}
          <Button fontSize={20} onClick={getNFTFromWallet} mt={36} ml={22} background={"#00cc00"}>
            Get your ERC-20 Token Balances
          </Button>
        </Flex>

        <Heading my={36}>Here are your NFTs:</Heading>

        {hasQueried ? (
          <SimpleGrid w={'90vw'} columns={4} spacing={24}>
            {results.ownedNfts.map((e, i) => {
              return (
                <Flex
                  flexDir={'column'}
                  padding={20}
                  borderWidth={1}
                  borderRadius={20}
                  borderStyle={"solid"}
                  w={'13vw'}
                  key={e.id}
                >
                  <Box>
                    <b>Name:</b>{' '}
                    {tokenDataObjects[i].title?.length === 0
                      ? 'No Name'
                      : tokenDataObjects[i].title}
                  </Box>
                  <Image
                    src={
                      tokenDataObjects[i]?.rawMetadata?.image ??
                      'https://via.placeholder.com/200'
                    }
                    alt={'Image'}
                  />
                </Flex>
              );
            })}
          </SimpleGrid>
        ) : (
          'Please make a query! The query may take a few seconds...'
        )}
      </Flex>
    </Box>
  );
}

export default App;
