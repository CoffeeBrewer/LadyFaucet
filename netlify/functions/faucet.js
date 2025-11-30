export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ ok: false, error: "Method not allowed" })
    };
  }

  try {
    const { address } = JSON.parse(event.body || "{}");
    if (!address) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: "Missing address" })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, txHash: "0xmockedhash123" })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "Server error" })
    };
  }
}
