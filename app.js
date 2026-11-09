(() => {
  const $ = (id) => document.getElementById(id);
  const form = $("registration-form");
  const packageSelect = $("package");
  const sizeWrap = $("shirt-size-wrap");
  const sizeSelect = $("shirt_size");
  const total = $("total");
  const prices = { no_shirt: 59.90, with_shirt: 99.90 };
  const whatsappNumber = "5581999510223";
  const pixKey = "52.244.653/0001-10";
  const money = value => Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  function updatePackage() {
    const selected = packageSelect.value;
    const hasShirt = selected === "with_shirt";
    sizeWrap.classList.toggle("hidden", !hasShirt);
    sizeSelect.required = hasShirt;
    total.textContent = prices[selected] ? money(prices[selected]) : "Selecione seu pacote";
  }
  packageSelect.addEventListener("change", updatePackage);

  form.addEventListener("submit", event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const packageName = data.get("package") === "with_shirt" ? "Com camisa azul" : "Sem camisa";
    const amount = prices[data.get("package")];
    const message = [
      "Olá! Quero solicitar minha inscrição no Treinão Novembro Azul do JP.",
      "",
      `Nome: ${data.get("full_name")}`,
      `WhatsApp: ${data.get("phone")}`,
      `E-mail: ${data.get("email")}`,
      `Distância: ${data.get("distance")}`,
      `Pacote: ${packageName}`,
      ...(data.get("package") === "with_shirt" ? [`Tamanho da camisa: ${data.get("shirt_size")}`] : []),
      `Valor: ${money(amount)}`,
      "Pagamento: Pix",
      `Chave Pix (CNPJ): ${pixKey}`,
      "",
      "Estou ciente de que a inscrição será confirmada após o retorno da organização e a confirmação do pagamento."
    ].join("\n");
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  });
  updatePackage();
})();
