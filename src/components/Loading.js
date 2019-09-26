
import React from 'react';
import { Spin } from 'antd';
const Loading = () => <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    width: '100vw',
    height: '100vh'
}}>
    <Spin size="large" />
</div>;

export default Loading;