import React from 'react';
import {useColorScheme} from 'react-native';
import {H6} from 'tamagui';
import {MyToggleGroupItem} from './MyToggleGroupItem';

interface MyButtonProps {
    id: number;
    label: string;
    value: string;
}

export function MyButton({id, label, value}: MyButtonProps) {
    const colorScheme = useColorScheme();

    let main_text_color = colorScheme === 'light' ? "black" : "white";
    let inverse_text_color = colorScheme === 'light' ? "white" : "black";

    return (
        <MyToggleGroupItem
            value={"" + id}
            active={value === "" + id}
            aria-label={label}
        >
            <H6 color={value == "" + id ? inverse_text_color : main_text_color}>
                {label}
            </H6>
        </MyToggleGroupItem>
    );
}
