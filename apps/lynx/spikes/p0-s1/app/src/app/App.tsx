// P2-V1 bisect step: bare render — no providers, no router, no stores.

import './App.css';

export function App() {
  return (
    <view className="SliceRoot">
      <view className="Page">
        <text className="PageTitle">bare render ok</text>
        <view className="Card">
          <text className="CardTitle">static card</text>
          <text className="MutedText">no providers</text>
        </view>
      </view>
    </view>
  );
}
