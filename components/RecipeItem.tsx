import Recipe, {CUP_TYPE} from '@/library/Recipe'
import React, {useState} from 'react'
import {Circle, Text, XStack, YStack} from 'tamagui'
import {Pressable, useColorScheme} from 'react-native'

export default function RecipeItem(props: {
    recipe: Recipe
    onPress: () => void
}) {
    const [pressed, setPressed] = useState(false)
    const [showDialog, setShowDialog] = useState(false)
    const colorScheme = useColorScheme();

    async function onPress() {
        props.onPress();
    }

    function getStyle(cup: number): any {
        let s = {backgroundColor: "#d1d1d1", borderWidth: 2, borderRadius: 20, borderColor: "#ffa592", width: "100%"};
        if (pressed) {
            if (colorScheme === "light") {
                s.backgroundColor = "#ffbaac";
                s.borderColor = "#ff6302";
            } else {
                s.backgroundColor = "#d44519";
                s.borderColor = "#ff6302";
            }
        } else {
            switch (cup) {
                case CUP_TYPE.TEA:
                    if (colorScheme === "light") {
                        s.backgroundColor = "#f0e7d2"
                        s.borderColor = "#c7b995";
                    } else {
                        s.backgroundColor = "#392F24";
                        s.borderColor = "#7C5D40";
                    }
                    break;
                default:
                    if (colorScheme === "light") {
                        s.backgroundColor = "#ffcfc5"
                        s.borderColor = "#ffa592";

                    } else {
                        s.backgroundColor = "#898989";
                        s.borderColor = "#f4511e";
                    }
            }
        }
        return s;
    }

    return (
        <YStack padding="$2">
            <Pressable style={getStyle(props.recipe.cupType)} onLongPress={() => setShowDialog(true)}
                       onPressIn={() => setPressed(true)}
                       onPress={() => onPress()} onPressOut={() => setPressed(false)}>
                <YStack paddingHorizontal="$2" paddingVertical="$1" alignItems='center'>
                    <Text
                        numberOfLines={1}
                        ellipsizeMode="middle"
                        paddingVertical="$1"
                        fontSize="$4"
                        textAlign="center"
                    >
                        {props.recipe.title}
                    </Text>
                    <XStack flex={1} justifyContent='space-evenly' width="100%" flexDirection='row'>
                        <YStack>
                            <Circle size="$7" borderColor="#ffa592" borderWidth={1}>
                                <Text fontSize={30} fontWeight={200}>{"1:" + props.recipe.ratio}</Text></Circle>
                            <Text alignSelf='center'>Ratio</Text>
                        </YStack>
                        <YStack>
                            <XStack flex={1} alignItems='center' justifyContent='center' borderColor="#ffa592"
                                    borderWidth={2}>
                                <Text padding="$2" fontSize={40}
                                      fontWeight={700}>{props.recipe.getTotalVolume() + " ml"}</Text></XStack>
                            <Text
                                alignSelf='center'>{props.recipe.getCupTypeName()} | {props.recipe.pours.length}</Text>
                        </YStack>
                        <YStack>
                            <Circle size="$7" borderColor="#ffa592" borderWidth={1}>
                                <Text fontSize={30} fontWeight={200}>{props.recipe.grindSize}</Text></Circle>
                            <Text alignSelf='center'>Grind</Text>
                        </YStack>
                    </XStack>
                </YStack>
            </Pressable>
        </YStack>
    )
}
