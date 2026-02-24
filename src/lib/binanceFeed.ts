type PriceCallback = (symbol: string, price: number) => void;

class BinanceFeed {
    private ws: WebSocket | null = null;
    private subscriptions: string[] = [];
    private onPriceUpdate: PriceCallback | null = null;
    private reconnectTimeout: NodeJS.Timeout | null = null;

    setCallback(cb: PriceCallback) {
        this.onPriceUpdate = cb;
    }

    connect() {
        if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
            return;
        }

        this.ws = new WebSocket('wss://stream.binance.com:9443/ws');

        this.ws.onopen = () => {
            console.log("Connected to Binance WebSocket");
            this.resubscribe();
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                // We expect payload from @ticker streams
                // data.s = symbol (e.g. BTCUSDT)
                // data.c = current close price
                if (data.e === '24hrTicker' && data.s && data.c) {
                    const symbol = data.s.toLowerCase().replace('usdt', ''); // e.g. 'btc'
                    const price = parseFloat(data.c);
                    if (this.onPriceUpdate) {
                        this.onPriceUpdate(symbol, price);
                    }
                }
            } catch (err) {
                // Ignore parse errors
            }
        };

        this.ws.onclose = () => {
            console.log("Disconnected from Binance WebSocket. Reconnecting in 5s...");
            this.ws = null;
            if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = setTimeout(() => this.connect(), 5000);
        };

        this.ws.onerror = (error) => {
            console.error("Binance WS Error:", error);
            this.ws?.close();
        };
    }

    subscribe(tokens: string[]) {
        const streams = tokens.map(t => `${t.toLowerCase()}usdt@ticker`);

        // Unsubscribe old
        if (this.ws && this.ws.readyState === WebSocket.OPEN && this.subscriptions.length > 0) {
            this.ws.send(JSON.stringify({
                method: "UNSUBSCRIBE",
                params: this.subscriptions,
                id: Date.now()
            }));
        }

        this.subscriptions = streams;

        if (this.ws && this.ws.readyState === WebSocket.OPEN && streams.length > 0) {
            this.ws.send(JSON.stringify({
                method: "SUBSCRIBE",
                params: streams,
                id: Date.now()
            }));
        } else if (!this.ws) {
            this.connect();
        }
    }

    private resubscribe() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN && this.subscriptions.length > 0) {
            this.ws.send(JSON.stringify({
                method: "SUBSCRIBE",
                params: this.subscriptions,
                id: Date.now()
            }));
        }
    }

    disconnect() {
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        if (this.ws) {
            this.ws.close();
        }
    }
}

export const binanceFeed = new BinanceFeed();
