import {XBloomRecipe} from '@/library/XBloomRecipe';
import {useRouter} from 'expo-router';
import React, {useEffect, useState} from 'react';
import {Image} from 'react-native';
import {Adapt, Button, Dialog, Fieldset, Sheet, Text, XStack, YStack,} from 'tamagui'


export default function ImportRecipeComponent(props: {
    onClose: () => void,
    recipeId?: string
}) {

    const [xBloomRecipe, setXBloomRecipe] = useState<XBloomRecipe | null>(null);
    const [displayDialog, setDisplayDialog] = useState(false);
    const router = useRouter();


    useEffect(() => {
        if (props.recipeId) {
            console.log("Import Recipe component id:" + props.recipeId);
            let xbloom = new XBloomRecipe(props.recipeId);
            xbloom.fetchRecipeDetail().then(() => {
                if (xbloom) {
                    console.log("URL:" + xbloom.getImageURL());
                    setXBloomRecipe(xbloom);
                    setDisplayDialog(true);
                }
            });
        }
    }, [props.recipeId]);

    async function onImport() {
        let recipe = xBloomRecipe?.getRecipe();
        setDisplayDialog(() => false)
        router.push({pathname: '/editRecipe', params: {recipeJSON: JSON.stringify(recipe), saveEnabled: "true"}});
    }

    async function onCancel() {
        setDisplayDialog(() => false)
        props.onClose();
    }

    async function onOpenChange(open: boolean) {
        props.onClose();
    }

    function DialogInstance() {
        return (
            <Dialog modal open={displayDialog} onOpenChange={(open) => onOpenChange(open)}>
                <Adapt platform="touch">
                    <Sheet
                        snapPoints={[xBloomRecipe && xBloomRecipe.getImageURL() !== "" ? 55 : 30, 100]} // Adjust heights as necessary
                        zIndex={200000} modal dismissOnSnapToBottom>
                        <Sheet.Frame padding="$4">
                            <Adapt.Contents/>
                        </Sheet.Frame>
                        <Sheet.Overlay
                            enterStyle={{opacity: 0}}
                            exitStyle={{opacity: 0}}
                        />
                    </Sheet>
                </Adapt>

                <Dialog.Portal>
                    <Dialog.Overlay
                        key="overlay"
                        opacity={0.5}
                        enterStyle={{opacity: 0}}
                        exitStyle={{opacity: 0}}
                    />

                    <Dialog.Content
                        bordered
                        elevate
                        key="content"
                        animateOnly={['transform', 'opacity']}
                        animation={[
                            'quick',
                            {
                                opacity: {
                                    overshootClamping: true,
                                },
                            },
                        ]}
                        enterStyle={{x: 0, y: -20, opacity: 0, scale: 0.9}}
                        exitStyle={{x: 0, y: 10, opacity: 0, scale: 0.95}}
                        gap="$4"
                    >
                        <Dialog.Title alignSelf='center' fontWeight={600}>Import Recipe</Dialog.Title>
                        <Dialog.Description>
                            You can import a recipe from an XBloom share link. Just click import.
                        </Dialog.Description>
                        <Fieldset alignSelf='center' gap="$4" horizontal>
                            <YStack alignSelf='center'>
                                <Text alignSelf='center' fontSize={22} fontWeight={500} justifyContent="center">
                                    {xBloomRecipe?.getName()}
                                </Text>
                                {xBloomRecipe && xBloomRecipe!.getSubtitle().length > 0 ?
                                    <Text paddingTop="$2" alignSelf='center' fontSize={18} fontWeight={300}
                                          justifyContent="center">
                                        {xBloomRecipe?.getSubtitle()}
                                    </Text> : ""}
                            </YStack>
                        </Fieldset>
                        {xBloomRecipe && xBloomRecipe.getImageURL() !== "" ?
                            <Image style={{width: 200, alignSelf: "center", height: 200}}
                                   source={{uri: xBloomRecipe?.getImageURL()}}/> : ""}


                        <XStack justifyContent="center" paddingTop="$7" gap="$7">
                            <Button theme="active" aria-label="Close" onPress={() => onCancel()}>
                                Cancel
                            </Button>
                            <Button theme="active" aria-label="import" onPress={() => onImport()}>
                                Import
                            </Button>

                        </XStack>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog>
        )
    }
    {
        return (
            <DialogInstance/>
        )
    }
}

