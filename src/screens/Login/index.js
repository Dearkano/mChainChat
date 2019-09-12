// 'use strict';
import React from 'react';
import {StyleSheet, View, Text, WebView, Component} from 'react-native';
import {
  Button,
  InputItem,
  List,
  PickerView,
  Toast,
  Provider,
} from '@ant-design/react-native';
import md5 from 'md5';
import sha256 from 'sha256';
import bs58 from 'bs58';
import {Buffer} from 'buffer';
import {withNavigation} from 'react-navigation';
import AsyncStorage from '@react-native-community/async-storage';
import g from '../../state';
import io from 'socket.io-client';

const host = 'http://10.6.71.79:8080';

const clusterOptions = [
  [
    {
      value: '47.75.197.211:8079',
      label: 'ACAC',
    },
    {
      value: '47.75.197.211:8081',
      label: 'AAAF',
    },
  ],
];

const styles = StyleSheet.create({
  col: {
    flex: 1,
    flexDirection: 'column',
    // alignItems: 'center', // this will prevent TFs from stretching horizontal
    marginLeft: 30,
    marginRight: 30,
    justifyContent: 'center',
    // backgroundColor: MKColor.Lime,
  },
  textfield: {
    height: 28, // have to do it on iOS
    marginTop: 32,
  },
  textfieldWithFloatingLabel: {
    height: 48, // have to do it on iOS
    marginTop: 10,
  },
  register: {
    color: '#1890ff',
    marginTop: 20,
  },
});

class Login extends React.Component {
  state = {
    username: '',
    password: '',
    host: ['47.75.197.211:8079'],
  };
  login = async () => {
    const {username, password} = this.state;
    const timestampRes = await fetch(`${host}/auth/time`);
    if (timestampRes.status !== 200) {
      Toast.fail('Network error!');
    }
    const timestampJson = await timestampRes.json();
    const timestamp = timestampJson.CurrentTimeStamp;
    const signature = md5(`${username}+${password}+${timestamp}`);
    const formData = new FormData();
    formData.append('email', username);
    formData.append('is_expire', 1);
    formData.append('timeStamp', timestamp);
    formData.append('signature', signature);
    const res = await fetch(`${host}/auth/signin`, {
      method: 'post',
      body: formData,
    });
    const data = await res.json();
    console.log(data);
    const isSuccess = data.SuccStatus > 0;
    if (!isSuccess) {
      Toast.fail('Username or password is incorrect!');
      return;
    }
    const token = data.Token;
    const expiredTime = data.ExpireAt;

    // check if keypair exists
    const res3 = await fetch(`${host}/v2/keypair/getall?token=${token}`);
    const data3 = await res3.json();
    console.log(data3);
    const isSuccess3 = data3.SuccStatus > 0;
    if (!isSuccess3) return;
    const keyPairs = data3.KeyPairs;
    let kpAddr = '';
    if (!keyPairs) {
      // create keypair
      const body = new FormData();
      body.append('token', token);
      body.append('key_type', 'rsa');
      const res1 = await fetch(`${host}/v2/keypair/create`, {
        method: 'post',
        body,
      });
      const data1 = await res1.json();
      console.log(data1);
      const isSuccess1 = data1.SuccStatus > 0;
      if (!isSuccess1) return;
      kpAddr = data1.KeyPairAddress;
    } else {
      kpAddr = keyPairs[0].KeyPairAddress;
    }

    const res2 = await fetch(
      `${host}/v2/keypair/get?token=${token}&key_pair_address=${kpAddr}`,
    );
    const data2 = await res2.json();
    console.log(data2);
    const isSuccess2 = data2.SuccStatus > 0;
    if (!isSuccess2) return;
    const publicKey = data2.PublicKey;
    const privateKey = data2.PrivateKey;
    // const privateKey = data2.PublicKey;
    // const publicKey = data2.PrivateKey;
    const hash = sha256.x2(publicKey);
    const addr = bs58.encode(Buffer.from(hash, 'hex'));
    const userInfoStr = JSON.stringify({
      username,
      token,
      expiredTime,
      publicKey,
      privateKey,
      addr,
    });
    await AsyncStorage.setItem('userInfo', userInfoStr);
    const hs =
      typeof this.state.host !== 'string'
        ? this.state.host[0]
        : this.state.host;
    console.log(hs);
    g.setHost(hs);
    g.login({
      username,
      token,
      expiredTime,
      publicKey,
      privateKey,
      addr,
    });

    // connect with server
    const body4 = new FormData();
    body4.append('token', token);
    // const encrypt = new JsEncrypt();
    // encrypt.setPublicKey(this.state.receiverPublicKey);
    // const encryptedContent = encrypt.encrypt(this.refs.input.state.value);
    // body.append("message", encryptedContent);
    body4.append('message', publicKey);
    const res4 = await fetch(`${host}/msg/upload`, {
      method: 'post',
      body: body4,
    });
    const data4 = await res4.json();
    console.log(data4);
    const isSuccess4 = data4.SuccStatus > 0;
    if (!isSuccess4) return;
    const afid = data4.Afid;

    const uri = `ws://${this.state.host}?user=${addr}`;
    console.log(uri);
    const ws = io(uri);
    ws.on('connect', async function() {
      console.log('on connection');
      ws.emit('publicKey', JSON.stringify({publicKey: afid, username: addr}));
      g.setWs(ws);
    });
    ws.on('newMes', async str => {
      const obj = JSON.parse(str);
      console.log('new mes');
      await g.getFriendList();
    });

    this.props.navigation.navigate('Friend');
    //   this.props.navigation.navigate('Chat', {
    //     receiver: 'FuKTBcX8jUcQxg2FntSwx89GRmeXNCw5o6BjYmmEjWoV',
    //   });
  };

  onChange = value => {
    this.setState({host: value});
  };

  render() {
    const {username, password} = this.state;
    return (
      <Provider>
        <View style={styles.col}>
          <List renderHeader={''}>
            <InputItem
              value={username}
              onChange={e => this.setState({username: e})}
              placeholder="Username"
            />
            <InputItem
              value={password}
              onChange={e => this.setState({password: e})}
              placeholder="Password"
              type="password"
            />
            <PickerView
              onChange={this.onChange}
              value={this.state.host}
              data={clusterOptions}
              cascade={false}
            />
            <Button type="primary" onPress={() => this.login()}>
              <Text>Login</Text>
            </Button>
          </List>
          <Text
            onPress={() => this.props.navigation.navigate('Register')}
            style={styles.register}>
            Register now!
          </Text>
        </View>
      </Provider>
    );
  }
}

export default withNavigation(Login);
