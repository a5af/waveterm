import React, { useState } from 'react';

interface DecodedJWT {
    header: Record<string, any>;
    payload: Record<string, any>;
    signature: string;
}

const App: React.FC = () => {
    const [token, setToken] = useState('');
    const [decoded, setDecoded] = useState<DecodedJWT | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const decodeToken = async () => {
        if (!token.trim()) {
            setError('Please enter a JWT token');
            setDecoded(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/decode', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token })
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error || `Server error: ${response.status} ${response.statusText}`);
                setDecoded(null);
                return;
            }

            setDecoded(result);
            setError(null);
        } catch (err) {
            if (err instanceof TypeError && err.message.includes('fetch')) {
                setError('Network error: Unable to connect to server');
            } else if (err instanceof SyntaxError) {
                setError('Server response error: Invalid JSON received');
            } else {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                setError(`Failed to decode token: ${errorMessage}`);
            }
            setDecoded(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-6">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-title font-bold mb-8 text-center">JWT Decoder</h1>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Input Section */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">JWT Token</label>
                            <textarea 
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                className="w-full h-64 p-4 bg-panel border border-border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent"
                                placeholder="Paste your JWT token here..."
                            />
                        </div>
                        
                        <button 
                            onClick={decodeToken}
                            disabled={loading}
                            className="w-full bg-accent hover:bg-accenthover disabled:opacity-50 text-background font-medium py-3 px-4 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                            {loading ? 'Decoding...' : 'Decode JWT'}
                        </button>
                        
                        {error && (
                            <div className="p-4 bg-error/20 border border-error/30 rounded-lg text-error">
                                {error}
                            </div>
                        )}
                    </div>
                    
                    {/* Output Section */}
                    <div className="space-y-4">
                        {/* Header */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Header</label>
                            <div className="p-4 bg-panel border border-border rounded-lg">
                                <pre className="font-mono text-sm text-muted-foreground">
                                    {decoded ? JSON.stringify(decoded.header, null, 2) : 'No token decoded yet'}
                                </pre>
                            </div>
                        </div>
                        
                        {/* Payload */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Payload</label>
                            <div className="p-4 bg-panel border border-border rounded-lg">
                                <pre className="font-mono text-sm text-muted-foreground">
                                    {decoded ? JSON.stringify(decoded.payload, null, 2) : 'No token decoded yet'}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;