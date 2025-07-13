async function makePayment() {
            const value = document.getElementById('paymentValue').value;
            const responseContainer = document.getElementById('responseContainer');
            const paymentButton = document.getElementById('paymentButton');

            if (!value || Number(value) <= 0) {
                responseContainer.textContent = 'Por favor, insira um valor válido.';
                return;
            }

            // **IMPORTANTE:** Este token é apenas um exemplo. Use o seu token real.
            const bearerToken = '37964|4LYoUpkrlfElReHmLnZGrOen2eWGFCNaYAsVoodkeb206456';

            const myHeaders = new Headers();
            myHeaders.append("Authorization", `Bearer ${bearerToken}`);
            myHeaders.append("Accept", "application/json");
            myHeaders.append("Content-Type", "application/json");

            const raw = JSON.stringify({
                "value": Number(value),
                "webhook_url": "https://hook.us2.make.com/lqdng7as4gl2s6v4j2ap0hw4qmyn3uwr", // Sua URL de webhook
                "split_rules": []
            });

            const requestOptions = {
                method: 'POST',
                headers: myHeaders,
                body: raw,
                redirect: 'follow'
            };

            paymentButton.disabled = true;
            paymentButton.textContent = 'Gerando...';
            responseContainer.textContent = 'Enviando requisição para a API...';

            try {
                const response = await fetch("https://api.pushinpay.com.br/api/pix/cashIn", requestOptions);
                const resultText = await response.text();

                if (!response.ok) {
                    throw new Error(`Erro da API: ${response.status} ${response.statusText} - ${resultText}`);
                }

                const jsonResult = JSON.parse(resultText);

                // Limpa o container de resposta antes de adicionar os novos elementos
                responseContainer.innerHTML = '';

                // 1. Adiciona a imagem do QR Code
                if (jsonResult.qr_code_base64) {
                    const qrImage = document.createElement('img');
                    qrImage.src = jsonResult.qr_code_base64;
                    qrImage.alt = "QR Code para pagamento Pix";
                    responseContainer.appendChild(qrImage);
                }

                // 2. Adiciona o código Pix "Copia e Cola" e o botão de copiar
                if (jsonResult.qr_code) {
                    const pixCodeContainer = document.createElement('div');
                    pixCodeContainer.className = 'pix-code-container';

                    const label = document.createElement('p');
                    label.innerHTML = '<strong>Pix Copia e Cola:</strong>';
                    pixCodeContainer.appendChild(label);

                    const pixCodeText = document.createElement('textarea');
                    pixCodeText.value = jsonResult.qr_code;
                    pixCodeText.readOnly = true;
                    pixCodeText.rows = 4;
                    pixCodeContainer.appendChild(pixCodeText);

                    const copyButton = document.createElement('button');
                    copyButton.textContent = 'Copiar Código';
                    copyButton.onclick = () => {
                        navigator.clipboard.writeText(jsonResult.qr_code).then(() => {
                            copyButton.textContent = 'Copiado!';
                            setTimeout(() => {
                                copyButton.textContent = 'Copiar Código';
                            }, 2000); // Volta ao texto original após 2 segundos
                        }).catch(err => {
                            console.error('Falha ao copiar:', err);
                            copyButton.textContent = 'Erro ao copiar';
                        });
                    };
                    pixCodeContainer.appendChild(copyButton);

                    responseContainer.appendChild(pixCodeContainer);
                }

                // Verifica se nenhum dos campos esperados foi encontrado
                if (!jsonResult.qr_code_base64 && !jsonResult.qr_code) {
                    responseContainer.textContent = "Resposta da API recebida, mas não contém 'qr_code_base64' ou 'qr_code'.";
                    console.log("Resposta completa:", jsonResult);
                }

            } catch (error) {
                console.error('Erro na requisição:', error);
                responseContainer.innerHTML = `<span style="color: red;"><strong>Ocorreu um erro:</strong> ${error.message}</span>`;
            } finally {
                paymentButton.disabled = false;
                paymentButton.textContent = 'Gerar QR Code';
            }
        }