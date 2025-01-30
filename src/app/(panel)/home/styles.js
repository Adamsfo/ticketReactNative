import colors from "@/src/constants/colors";
import { Platform } from "react-native";
import styled from "styled-components/native";


export const Container = styled.View`
    flex: 1;
`;

export const Title = styled.Text`
margin-top: ${Platform.OS === 'ios' ? 35 + '%' : 20 + '%'}px;
`;

export const ListEventos = styled.FlatList`
`;