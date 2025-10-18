import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
  Share,
} from "react-native";
import { Ingresso } from "@/src/types/geral";
import { useRouter } from "expo-router";
import {
  CalendarIcon,
  MapPinIcon,
  PrinterIcon,
  Share2Icon,
  ShareIcon,
} from "lucide-react-native";
import { formatInTimeZone } from "date-fns-tz";
import { parseISO, set } from "date-fns";
import colors from "@/src/constants/colors";
import { Badge } from "@/src/components/Badge";
import { api } from "@/src/lib/api";
import * as Print from "expo-print";
import { Feather } from "@expo/vector-icons";
import ModalEditNomeImpresso from "../ModalEditNomeImpresso";
import { useNavigation } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import ModalMsg from "../ModalMsg";
import ModalAtribuirOutroUsuario from "../ModalAtribuirOutroUsuario";
import ZoomableImage from "../ZoomableImage";

type Props = {
  item: Ingresso;
  getRegistros?: (params: any) => void;
};

export default function CardIngresso({ item, getRegistros }: Props) {
  const router = useRouter();
  const [visibleNomeImpresso, setVisibleNomeImpresso] = useState(false);
  const [visibleModalUsuario, setVisibleModalUsuario] = useState(false);
  const [modalMsg, setModalMsg] = useState(false);
  const [msg, setMsg] = useState("");
  const navigation = useNavigation() as any;

  const handlePrint = async (item: Ingresso) => {
    const html = `
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 5px; }
          .card { border: 1px solid #ddd; padding: 7px; border-radius: 8px; max-width: 300px; margin: auto; }
          .title { font-size: 14px; font-weight: bold; margin-bottom: 6px; }
          .ticket { font-size: 12px; font-weight: bold; margin-bottom: 6px; }
          .image { width: 100%; max-height: 250px; object-fit: cover; border-radius: 6px; margin-bottom: 6px; }
          .info { font-size: 12px; margin-bottom: 6px; }
          .label { font-size: 12px; font-weight: bold; }
          .qrcode { margin-left: -10px; text-align: center; }
          .id { font-size: 10px; margin-top: 6px; }
        </style>
      </head>
      <body>
        <div class="card">
          <img class="image" src="${api.getBaseApi()}/uploads/${
      item.Evento_imagem
    }" />
                      <div class="title">${item.Evento_nome}</div>
                      ${
                        item.tipo === "Cortesia"
                          ? '<div class="ticket">Cortesia</div>'
                          : ""
                      }
                      <div class="ticket">${item.TipoIngresso_descricao} ${
      item.EventoIngresso_nome
    }</div>
                ${
                  item.nomeImpresso
                    ? `<div class="ticket">${item.nomeImpresso}</div>`
                    : ""
                }
          <div class="info"><span class="label">Status:</span> ${
            item.status
          }</div>
          <div class="info"><span class="label">Data:</span> ${formatInTimeZone(
            parseISO((item.Evento_data_hora_inicio ?? "").toString()),
            "America/Cuiaba",
            "dd/MM/yyyy HH:mm"
          )}</div>
          <div class="info"><span class="label">Endereço:</span> ${
            item.Evento_endereco
          }</div>       
          <div class="id">
            Identificação: ${item.id}
          </div> 
          <div class="qrcode">
            <img src="${item.qrCodeBase64}" width="200" />
          </div>
          
      </body>
    </html>
  `;
    if (Platform.OS === "web") {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } else {
      await Print.printAsync({ html });
    }
  };

  const handleEditNomeImpresso = () => {
    setVisibleNomeImpresso(true);
  };

  return (
    <View style={styles.card}>
      <Image
        source={{ uri: api.getBaseApi() + "/uploads/" + item.Evento_imagem }}
        style={styles.image}
      />
      <View style={styles.cardContent}>
        <View style={styles.header}>
          <Text style={styles.eventTitle}>{item.Evento_nome}</Text>
          <Badge
            variant={item.status === "Confirmado" ? "default" : "secondary"}
          >
            {item.status}
          </Badge>
        </View>
        {item.tipo === "Cortesia" && (
          <View style={styles.row}>
            <Text style={styles.ticketTitle}>Cortesia</Text>
          </View>
        )}
        <View>
          <Text style={styles.ticketTitle}>
            {item.TipoIngresso_descricao} {item.EventoIngresso_nome}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={styles.labelNome}>{item.nomeImpresso}</Text>
          <TouchableOpacity
            style={styles.buttonName}
            onPress={() => handleEditNomeImpresso()}
          >
            <Feather name="edit" size={18} color={colors.branco} />
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <CalendarIcon size={16} color="#6b7280" />
          <Text style={styles.text}>
            {" "}
            {item.idEvento != 1 ? "Início do evento" : "Válido à partir"}{" "}
            {item.dataValidade
              ? formatInTimeZone(
                  parseISO(item.dataValidade.toString()),
                  "America/Cuiaba",
                  "dd/MM/yyyy " + (item.idEvento != 1 ? "HH:mm" : "")
                )
              : "Data não disponível"}
          </Text>
        </View>

        <View style={styles.row}>
          <MapPinIcon size={16} color="#6b7280" />
          <Text style={styles.text}>{item.Evento_endereco}</Text>
        </View>

        <View style={{ alignItems: "center" }}>
          {item.qrCodeBase64?.startsWith("data:image") && (
            <ZoomableImage uri={item.qrCodeBase64} />
            // <Image style={styles.qr} source={{ uri: item.qrCodeBase64 }} />
          )}
        </View>

        {/* <Image
          source={require("../../assets/MoveVip.png")}
          style={styles.imageParceiro}
        /> */}

        <View style={[styles.row]}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => handlePrint(item)}
          >
            <Text style={styles.buttonText}>
              <Feather name="printer" size={16} color="#fff" />
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={async () => {
              const url = `${api.getBaseUrlSite()}ingresso?qrcode=${
                item.qrcode
              }`;

              if (Platform.OS === "web") {
                try {
                  if (item.idEvento === 1) {
                    setMsg(
                      "O ingresso do Pesque Pague jango não pode ser compartilhado, necessário transferir para quem vai utilizar. Pois a comanda é aberta no momento da entrada e no CPF do proprietário do ingresso."
                    );
                    setModalMsg(true);
                  } else {
                    await Clipboard.setStringAsync(url);
                    setMsg("O link foi copiado para a área de transferência.");
                    setModalMsg(true);
                  }
                } catch (err) {
                  setMsg("Não foi possível copiar o link.");
                }
              } else {
                try {
                  await Share.share({
                    message: url,
                  });
                } catch (err) {
                  setMsg("Não foi possível compartilhar o link.");
                }
              }
            }}
            // onPress={() =>
            //   navigation.navigate("ingresso", {
            //     qrcode: item.qrcode,
            //   })
            // }
          >
            <Text style={[styles.buttonText, { paddingTop: 0 }]}>
              {/* <Share2Icon size={16} color="#fff" /> */}
              <Feather
                name="share-2"
                size={16}
                color="#fff"
                style={{ marginRight: 4 }}
              />
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => setVisibleModalUsuario(true)}
          >
            <Text style={styles.buttonText}>
              <Feather name="share" size={16} color="#fff" /> Transferir
            </Text>
          </TouchableOpacity>
        </View>

        <Modal visible={visibleNomeImpresso} transparent animationType="slide">
          <ModalEditNomeImpresso
            onClose={() => setVisibleNomeImpresso(false)}
            item={item}
          />
        </Modal>

        <Modal visible={modalMsg} transparent animationType="fade">
          <ModalMsg onClose={() => setModalMsg(false)} msg={msg} />
        </Modal>

        <Modal visible={visibleModalUsuario} transparent animationType="fade">
          <ModalAtribuirOutroUsuario
            onClose={() => {
              setVisibleModalUsuario(false);
              if (getRegistros) {
                getRegistros({
                  filters: { idUsuario: item.idUsuario, status: "Confirmado" },
                });
              }
            }}
            item={item}
          />
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#f9fafb",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
    marginHorizontal: 6,
    maxWidth: 400,
    // marginBottom: 16,
  },
  image: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
  },
  cardContent: {
    padding: 16,
    gap: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // marginBottom: 4,
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  ticketTitle: {
    fontSize: 18,
    fontWeight: "600",
    // marginBottom: 3,
  },
  labelNome: {
    fontSize: 16,
    fontWeight: "600",
    // marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    // gap: 1,
    marginTop: 0,
  },
  text: {
    color: "#6b7280",
    fontSize: 14,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 2,
    backgroundColor: colors.azul,
  },
  buttonName: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 10,
    backgroundColor: colors.azul,
    width: 36,
  },
  buttonText: {
    color: colors.branco,
    fontWeight: "600",
  },
  qr: { width: 200, height: 200, marginBottom: 10 },
  imageParceiro: {
    width: "60%",
    height: 80,
    resizeMode: "cover",
    alignContent: "center",
    alignSelf: "center",
    marginBottom: 10,
    borderRadius: 8,
  },
});
