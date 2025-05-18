/* eslint-disable import/no-anonymous-default-export */
// const BASEAPI = 'http://192.168.1.2:80/PDVServer.dll/datasnap/rest/TSM';
// const BASEAPIFotos = 'http://192.168.1.2:80';

const BASEAPI = "http://160.20.20.102:8010/PDVServer.dll/datasnap/rest/TSM";
const BASEAPIFotos = "http://160.20.20.102:8010";

// 192.168.0.2
// 160.20.20.102:8080

const apiFetchGet = async (endpoint: string, body: any = "") => {
  // if (!body.token) {
  //     let token = Cookies.get('token_idcliente');
  //     if(token) {
  //         body.token = token;
  //     }
  // }

  //`${BASEAPI+endpoint}/${qs.stringify(body)}`
  let res = await fetch(BASEAPI + endpoint + body);

  // res = res + '["error": "CPF e/ou senha errados!"]';

  const json = await res.json();

  return json;
};

const apiFetchPut = async (endpoint: string, body: any) => {
  const res = await fetch(BASEAPI + endpoint, {
    method: "PUT",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Access-Control-Allow-Origin": "*",
      "Accept-Encoding": "identity",
      Accept: "application/json, text/plain; q=0.9, text/html;q=0.8,",
      AcceptCharset: "UTF-8, *;q=0.8",
      Server: "Microsoft-IIS/10.0",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();

  return json;
};

const apiFetchPost = async (endpoint: string, body: any) => {
  const res = await fetch(BASEAPI + endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Access-Control-Allow-Origin": "*",
      "Accept-Encoding": "identity",
      Accept: "application/json, text/plain; q=0.9, text/html;q=0.8,",
      AcceptCharset: "UTF-8, *;q=0.8",
      Server: "Microsoft-IIS/10.0",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    },
    body: JSON.stringify(body).toUpperCase().replace("[", "").replace("]", ""),
  });
  const json = await res.json();

  return json;
};

const PdvApiJango = {
  getCliente: async (cpf_cnpj: string) => {
    const json = await apiFetchGet(
      "/Cliente",
      "/cpf_cnpj='" + cpf_cnpj.replace(/\D/g, "") + "'"
    );

    if (json.length === 0) {
      const erro = JSON.parse('{"error": "CPF e/ou senha errados!"}');
      return erro;
    } else {
      return json;
    }
  },

  getConta: async (id_cliente: string | number, atual = true) => {
    let str = "";

    if (atual) {
      str = "/venda/status = 0 and ";
    } else {
      str = "/venda/";
    }

    let json = await apiFetchGet(
      str + "venda.id_cliente = " + id_cliente + "/id_venda desc"
    );

    if (json.length === 0) {
      json = JSON.parse(
        '{"error": "Não existe nenhuma conta aberta no seu CPF."}'
      );
      return json;
    } else {
      return json;
    }
  },

  atualizarCliente: async (cliente: any) => {
    // let dados = JSON.stringify(cliente);
    // dados = dados.toUpperCase().replace('[','').replace(']','');
    // cliente = JSON.parse(dados);
    delete cliente.ROWID;
    delete cliente.DATA_CRIACAO;
    apiFetchPut("/cliente", cliente);
  },
};

export default () => PdvApiJango;
