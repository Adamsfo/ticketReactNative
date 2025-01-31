import colors from "@/src/constants/colors";
import { Platform } from "react-native";
import styled from "styled-components/native";


export const Container = styled.View`
    flex: 1;
    padding: ${Platform.OS === 'ios' ? StatusBar.currentHeight + 120 : (Platform.OS === 'android' ? 120 : '80')}px 40px 20px 20px;    
`;

export const Title = styled.Text`
    font-size: 24px;
    font-weight: bold;
`;

export const ListEventos = styled.FlatList`
    flex-direction: row;
`;