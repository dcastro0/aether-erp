export function generatePixPayload(key: string, name: string, city: string, amount: number, txId: string = "***"): string {
  function formatField(id: string, value: string): string {
    const len = value.length.toString().padStart(2, "0");
    return `${id}${len}${value}`;
  }

  const gui = formatField("00", "br.gov.bcb.pix");
  const keyField = formatField("01", key);
  const merchantAccountInfo = formatField("26", `${gui}${keyField}`);

  const formattedAmount = amount.toFixed(2);
  const merchantCategory = formatField("52", "0000");
  const currency = formatField("53", "986");
  const amountField = formatField("54", formattedAmount);
  const country = formatField("58", "BR");
  const merchantName = formatField("59", name.substring(0, 25));
  const merchantCity = formatField("60", city.substring(0, 15));
  const additionalData = formatField("62", formatField("05", txId));

  const payloadNoCrc = `000201${merchantAccountInfo}${merchantCategory}${currency}${amountField}${country}${merchantName}${merchantCity}${additionalData}6304`;

  let crc = 0xffff;
  for (let i = 0; i < payloadNoCrc.length; i++) {
    crc ^= payloadNoCrc.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
      crc &= 0xffff;
    }
  }

  const crcHex = crc.toString(16).toUpperCase().padStart(4, "0");
  return `${payloadNoCrc}${crcHex}`;
}
