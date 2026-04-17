# Position sizing basics

Position size ties **account risk** to **stop distance**. A common approach:

1. Choose a max loss per trade (e.g. 0.5–1% of equity).
2. Measure stop distance in dollars per share or contract.
3. Divide allowed loss by stop distance to get units.

```text
units = floor(allowed_loss / stop_distance)
```

This is educational content only—not financial advice.
