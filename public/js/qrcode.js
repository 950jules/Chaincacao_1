const qrcodeControl = {
    generate(elementId, data) {
        const element = document.getElementById(elementId);
        element.innerHTML = "";
        new QRCode(element, {
            text: data,
            width: 200,
            height: 200,
            colorDark: "#5C3A21",
            colorLight: "#ffffff"
        });
    },

    async scan(elementId, onResult) {
        const html5QrCode = new Html5Qrcode(elementId);
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        
        await html5QrCode.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
                html5QrCode.stop();
                onResult(decodedText);
            }
        );
        return html5QrCode;
    }
};
