export const VERSAO_POLITICA_HOSPEDAGEM = "2026-09-v1";

export const TITULO_POLITICA_HOSPEDAGEM =
  "Política de Cancelamento, Remarcação e Alteração de Hóspedes";

export type SecaoPoliticaHospedagem = {
  titulo: string;
  paragrafos: string[];
};

export const POLITICA_CANCELAMENTO_HOSPEDAGEM_SECOES: SecaoPoliticaHospedagem[] =
  [
    {
      titulo: "1. Cancelamento com mais de 72 horas de antecedência",
      paragrafos: [
        "O hóspede poderá solicitar o cancelamento da reserva com mais de 72 (setenta e duas) horas de antecedência em relação à data prevista para o check-in, sem cobrança de taxa de cancelamento.",
        "Nesse caso, será realizado o reembolso de 100% do valor pago, observadas as condições e os prazos da forma de pagamento utilizada.",
      ],
    },
    {
      titulo: "2. Cancelamento dentro do período de 72 horas",
      paragrafos: [
        "Para cancelamentos solicitados dentro das 72 (setenta e duas) horas que antecedem a data prevista para o check-in, será realizado o reembolso de 50% do valor pago, ficando os 50% restantes retidos em razão do cancelamento próximo à data da hospedagem.",
      ],
    },
    {
      titulo: "3. Remarcação com mais de 72 horas de antecedência",
      paragrafos: [
        "A solicitação de remarcação realizada com mais de 72 (setenta e duas) horas de antecedência em relação à data prevista para o check-in poderá ser realizada sem cobrança de taxa de remarcação, desde que haja disponibilidade para a nova data.",
        "Caso a nova data escolhida possua valor de diária superior ao da reserva original, será cobrada a respectiva diferença de tarifa.",
      ],
    },
    {
      titulo: "4. Remarcação dentro do período de 72 horas",
      paragrafos: [
        "Para solicitações de remarcação realizadas dentro das 72 (setenta e duas) horas que antecedem a data prevista para o check-in, será aplicada a taxa de remarcação no valor de R$ 100,00 (cem reais), além de eventual diferença de tarifa decorrente da alteração da data ou acomodação escolhida.",
        "A remarcação estará sujeita à disponibilidade da pousada e deverá ser solicitada pelos canais oficiais de atendimento.",
      ],
    },
    {
      titulo: "5. Quantidade de hóspedes informada na reserva",
      paragrafos: [
        "O valor da reserva é calculado de acordo com a quantidade de hóspedes informada no momento da contratação.",
        "A capacidade máxima indicada para uma acomodação representa apenas o limite máximo de ocupação permitido, não significando que o hóspede poderá ocupar a acomodação com a capacidade máxima pagando o valor correspondente à quantidade mínima de hóspedes.",
        "Por exemplo, caso uma acomodação tenha capacidade para até 6 (seis) pessoas, mas a tarifa contratada corresponda a 3 (três) hóspedes, o valor pago será referente a 3 (três) hóspedes.",
        "Caso o hóspede compareça à pousada com quantidade superior à informada na reserva, os hóspedes adicionais estarão sujeitos à cobrança da diferença correspondente, conforme os valores vigentes informados no site da pousada.",
        "A cobrança dos hóspedes adicionais deverá ser realizada antes ou no momento do check-in, conforme orientação da pousada.",
        "Exemplo: se a reserva foi realizada para 3 (três) hóspedes e a acomodação comporta até 6 (seis) pessoas, a apresentação de 4, 5 ou 6 hóspedes no momento do check-in implicará a cobrança correspondente aos hóspedes adicionais, de acordo com a tarifa vigente para a acomodação.",
        "O hóspede declara estar ciente de que a capacidade máxima da acomodação não corresponde ao valor da diária, sendo o preço da reserva determinado pela quantidade de pessoas informada no momento da contratação.",
      ],
    },
    {
      titulo: "6. Alteração da quantidade de hóspedes antes do check-in",
      paragrafos: [
        "Caso o hóspede queira adicionar pessoas à reserva antes da data da hospedagem, deverá solicitar previamente a alteração à pousada.",
        "A inclusão de hóspedes adicionais estará sujeita à disponibilidade e à cobrança dos respectivos valores, conforme as tarifas vigentes e os valores apresentados no site da pousada.",
        "Caso a alteração resulte na necessidade de mudança de acomodação ou categoria de quarto, poderá ser cobrada também eventual diferença de tarifa.",
      ],
    },
    {
      titulo: "7. Limite máximo de ocupação",
      paragrafos: [
        "A quantidade de hóspedes em cada acomodação deverá respeitar o limite máximo de ocupação informado no site e na confirmação da reserva.",
        "Não será permitida a ocupação da acomodação por quantidade de pessoas superior à sua capacidade máxima, ainda que o hóspede esteja disposto a pagar eventual valor adicional.",
      ],
    },
    {
      titulo: "8. Não comparecimento (No-show)",
      paragrafos: [
        "O não comparecimento do hóspede na data prevista para o check-in, sem solicitação prévia de cancelamento ou remarcação, será considerado no-show e estará sujeito às condições de cancelamento aplicáveis à reserva.",
      ],
    },
    {
      titulo: "9. Conferência da quantidade de hóspedes no check-in",
      paragrafos: [
        "No momento do check-in, a pousada poderá realizar a conferência da quantidade de hóspedes que efetivamente ocuparão a acomodação.",
        "Caso seja identificada quantidade de hóspedes superior à informada na reserva, os valores correspondentes aos hóspedes adicionais serão cobrados conforme as tarifas vigentes.",
        "A entrada ou permanência de hóspedes adicionais estará condicionada ao respeito à capacidade máxima da acomodação e às demais regras da pousada.",
      ],
    },
    {
      titulo: "10. Condições gerais",
      paragrafos: [
        "As solicitações de cancelamento, remarcação ou alteração da quantidade de hóspedes serão consideradas a partir do momento em que forem recebidas pela pousada através dos canais oficiais de atendimento nos WhatsApps 65 99307-4619 ou 98479-1202.",
        "Os prazos serão calculados considerando a data e o horário previstos para o check-in, conforme informado na confirmação da reserva.",
        "Toda solicitação de alteração estará sujeita à disponibilidade da pousada.",
        "Eventuais condições promocionais ou tarifas especiais poderão possuir regras específicas de cancelamento, remarcação e quantidade de hóspedes, que serão informadas ao hóspede antes da conclusão da reserva.",
        "Esta política não afasta direitos assegurados ao consumidor pela legislação brasileira aplicável.",
        "Ao concluir a reserva, o hóspede declara estar ciente das condições desta Política de Cancelamento, Remarcação e Alteração de Hóspedes.",
      ],
    },
  ];
