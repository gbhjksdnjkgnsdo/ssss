import { PlayerSdk, PlayerTheme } from '@api.video/player-sdk'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useRouter } from 'next/router'
import React, { ChangeEvent, useEffect, useState } from 'react'
import { Button, Footer, GlobalContainer, Header, InputsContainer, PlayerSdkContainer, Text, TextsContainer } from '../style/common'

interface IVideoViewProps {
    children: React.ReactNode
    videoId: string
    width: string
    height: string
}
const VideoView: React.FC<IVideoViewProps> = ({
    videoId,
    width,
    height
}): JSX.Element => {
    const [player, setPlayer] = useState<PlayerSdk | undefined>(undefined)
    const [playerSettings, setPlayerSettings] = useState<PlayerTheme>({
        link: 'rgb(235, 137, 82)',
        linkHover: 'rgb(240, 95, 12)'
    })
    const [hideControls, setHideControls] = useState<boolean>(false)
    const router = useRouter()

    useEffect(() => {
        const player = new PlayerSdk('#player', {
            id: videoId,
        })
        player.setTheme(playerSettings)
        setPlayer(player)
    }, [])
    useEffect(() => {
        player && player?.loadConfig({ id: videoId, hideControls: hideControls })
    }, [hideControls, player])

    const handleChangeSetting = (e: ChangeEvent<HTMLInputElement>, prop: string) => {
        const newSettings = { ...playerSettings, [prop]: e.currentTarget.value }
        setPlayerSettings(newSettings)
        player?.setTheme(newSettings)
    }

    return (
        <GlobalContainer>
            <Head>
                <title>Video view</title>
                <meta name="description" content="Generated by create next app & created by api.video" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <Header><span>Already there</span> 🎉</Header>

            <main>
                <TextsContainer>
                    <Text>
                        This player is generated by the <a target="_blank" href="https://github.com/apivideo/api.video-player-sdk">api.video's Player SDK</a>.<br />
                        It provides multiple properties to customize your video player.
                    </Text>
                    <Text>Try 3 of them just bellow 👇</Text>
                </TextsContainer>

                <InputsContainer>
                    <div>
                        <label>Play button color</label>
                        <input 
                            type="text" 
                            placeholder="Play button color" 
                            value={playerSettings.link}
                            onChange={e => handleChangeSetting(e, 'link')}
                        />
                    </div>
                    <div>
                        <label>Buttons hover color</label>
                        <input 
                            type="text" 
                            placeholder="Buttons hover color" 
                            value={playerSettings.linkHover}
                            onChange={e => handleChangeSetting(e, 'linkHover')}
                        />
                    </div>
                    <div>
                        <input 
                            type="checkbox"
                            checked={hideControls}
                            onChange={e => {
                                setHideControls(e.currentTarget.checked)
                            }}
                        />
                        <label>Hide controls</label>
                    </div>
                </InputsContainer>
                <PlayerSdkContainer 
                    id="player"
                    $width={parseInt(width)}
                    $height={parseInt(height)}
                />

                <Button onClick={() => router.push('/')}>
                    Another video?
                </Button>
            </main>

            <Footer>
                <a
                href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
                target="_blank"
                rel="noopener noreferrer"
                >
                    Powered by{' '}
                    <span>
                        <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
                    </span>
                </a>
                <span>and</span>
                <a href='https://api.video'
                target="_blank"
                rel="noopener noreferrer"
                >
                    api.video
                </a>
            </Footer>
        </GlobalContainer>
    )

}

export default VideoView

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { videoId, w, h } = context.query
    return { props: { videoId, width: w ?? null, height: h ?? null } }
}
