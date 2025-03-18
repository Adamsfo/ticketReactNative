import colors from "@/src/constants/colors";
import styled from "styled-components/native";

export const ModalContainer = styled.View`
flex: 1;
`;

export const Container = styled.View`
flex: 1;
background-color: #FFF;
border-top-left-radius: 10px;
border-top-right-radius: 10px;
padding: 0 15px;
`;

export const Header = styled.View`
flex-direction: row;
justify-content: space-between;
margin-top: 10px 0;
padding: 8px 0;
`;

export const Area = styled.View`
flex: 1;
align-items: center;
`;

export const Title = styled.Text`
font-size: 33px;
font-weight: bold;
color: ${colors.cinza};
margin-top: 5px;
`;

export const Mensagem = styled.Text`
font-size: 17px;
color: #1a7a7a7;
margin-bottom: 30px;
margin-top: 10px;
font-size: 18px;
`;