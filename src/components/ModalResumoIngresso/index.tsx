import React from "react";
import {
  ModalContainer,
  Container,
  Header,
  Area,
  Title,
  Mensagem,
} from "./styles";
import { Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { View, TouchableWithoutFeedback } from "react-native";

interface ModalResumoIngresso {
  onClose: () => void;
}

export default function ModalResumoIngresso({ onClose }: ModalResumoIngresso) {
  return (
    <ModalContainer>
      <TouchableWithoutFeedback>
        <View style={{ flex: 1 }}></View>
      </TouchableWithoutFeedback>
      <Container>
        <Header>
          <TouchableOpacity>
            {/* <Feather name="share" size={30} color="#212743" /> */}
          </TouchableOpacity>
          {/* <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={30} color="#212743" />
          </TouchableOpacity> */}
        </Header>

        <Area>
          <Title>Titulo Mensagem</Title>
          <Mensagem>
            <Text>Mensagem</Text>
          </Mensagem>
        </Area>
      </Container>
    </ModalContainer>
  );
}
