import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import GATConv


class ContentGraphGAT(torch.nn.Module):
    """
    Graph Attention Network (GAT) untuk klasifikasi konten berita hoax.

    Peningkatan untuk akurasi >90%:
    - BatchNorm1d setelah setiap hidden layer -> training lebih stabil
    - Skip connection (residual) jika dimensi cocok -> gradien lebih lancar
    - Inisialisasi bobot yang lebih baik (xavier_uniform_)

    Arsitektur:
        Input -> [GATConv -> BatchNorm -> ELU -> Dropout -> (+ Residual)] × (n-1) -> GATConv -> LogSoftmax
    """

    def __init__(
        self,
        in_channels: int,
        hidden_channels: int = 256,
        out_channels: int    = 2,
        heads: int           = 8,
        dropout: float       = 0.3,
        num_layers: int      = 2,
    ):
        super().__init__()
        self.dropout    = dropout
        self.num_layers = max(num_layers, 2)

        self.convs = nn.ModuleList()
        self.norms = nn.ModuleList()

        # -- Input layer ----------------------------------------------
        # Output dim of GATConv with concat=True: hidden_channels × heads
        self.convs.append(
            GATConv(in_channels, hidden_channels, heads=heads,
                    dropout=dropout, add_self_loops=True)
        )
        self.norms.append(nn.BatchNorm1d(hidden_channels * heads))

        # -- Hidden layers (if num_layers > 2) ------------------------
        for _ in range(self.num_layers - 2):
            self.convs.append(
                GATConv(hidden_channels * heads, hidden_channels, heads=heads,
                        dropout=dropout, add_self_loops=True)
            )
            self.norms.append(nn.BatchNorm1d(hidden_channels * heads))

        # -- Output layer (single head) --------------------------------
        self.convs.append(
            GATConv(hidden_channels * heads, out_channels, heads=1,
                    concat=False, dropout=dropout, add_self_loops=True)
        )

        # -- Optional projection for input residual -------------------
        # Used only if in_channels != hidden_channels * heads
        self.input_proj = (
            nn.Linear(in_channels, hidden_channels * heads, bias=False)
            if in_channels != hidden_channels * heads else None
        )

        self._init_weights()

    def _init_weights(self):
        """Xavier init untuk linear layers."""
        if self.input_proj is not None:
            nn.init.xavier_uniform_(self.input_proj.weight)

    def forward(self, x: torch.Tensor, edge_index: torch.Tensor) -> torch.Tensor:
        """Forward pass — returns log_softmax (untuk F.nll_loss saat training)."""
        x = F.dropout(x, p=self.dropout, training=self.training)

        for i, conv in enumerate(self.convs[:-1]):
            identity = x   # simpan sebelum transform

            x = conv(x, edge_index)
            x = self.norms[i](x)
            x = F.elu(x)
            x = F.dropout(x, p=self.dropout, training=self.training)

            # Skip connection: tambahkan residual jika dimensi cocok
            if i == 0 and self.input_proj is not None:
                x = x + self.input_proj(identity)
            elif identity.shape == x.shape:
                x = x + identity

        # Output layer (no activation sebelum log_softmax)
        x = self.convs[-1](x, edge_index)
        return F.log_softmax(x, dim=1)

    def predict_proba(self, x: torch.Tensor, edge_index: torch.Tensor) -> torch.Tensor:
        """
        Inferensi — returns Softmax probabilities [0.0, 1.0].
        Layer Softmax aktif otomatis di sini untuk distribusi probabilitas.
        """
        self.eval()
        with torch.no_grad():
            for i, conv in enumerate(self.convs[:-1]):
                identity = x
                x = conv(x, edge_index)
                x = self.norms[i](x)
                x = F.elu(x)
                if i == 0 and self.input_proj is not None:
                    x = x + self.input_proj(identity)
                elif identity.shape == x.shape:
                    x = x + identity
            x = self.convs[-1](x, edge_index)
            return torch.softmax(x, dim=1)    # === Softmax Layer (output probabilitas) ===
