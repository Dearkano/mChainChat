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
const config = require('../../config.json')
const host = config.bos;

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

class Register extends React.Component {
  state = {
    email: '',
    defaultPassword: '',
    step: 0,
    pwd1: '',
    pwd2: '',
    invitationCode: '',
  };

  register = async e => {
    const {email, invitationCode} = this.state;
    const reg = /^[A-Za-z0-9\u4e00-\u9fa5]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;
    if (!reg.test(email)) {
      Toast.fail('Please input the correct email address!!');
      return;
    }
    const body = new FormData();
    body.append('email', email);
    body.append('invitation_code', invitationCode);
    const res = await fetch(`${host}/auth/signup`, {
      method: 'post',
      body,
    });
    if (res.status !== 200) {
        Toast.fail('Network error!')
        return;
    }
    const data = await res.json();
    console.log(data);
    if (data.SuccStatus <= 0) {
        Toast.fail('The email address has already been used!')
        return;
    }
    const defaultPassword = data.Password;
    this.setState({
      step: 1,
      defaultPassword,
    });
  };

  changePassword = async e => {
    const {
      email,
      invitationCode,
      pwd1,
      pwd2,
      step,
      defaultPassword,
    } = this.state;
    console.log(1);
    if (pwd1 !== pwd2) {
      Toast.fail('The input passwords must be consistent');
      return;
    }
    console.log('2');
    const timestampRes = await fetch(`${host}/auth/time`);
    const timestampJson = await timestampRes.json();
    const timestamp = timestampJson.CurrentTimeStamp;
    const body = new FormData();
    const signature = md5(`${email}+${defaultPassword}+${timestamp}`);
    body.append('email', email);
    body.append('timeStamp', timestamp);
    body.append('new_password', pwd1);
    body.append('signature', signature);
    const res = await fetch(`${host}/auth/changepassword`, {
      method: 'post',
      body,
    });
    if (res.status !== 200) {
        Toast.fail('Network error!')
        return;
    }
    const data = await res.json();
    console.log(data);
    if (data.SuccStatus <= 0) return;
    this.props.navigation.navigate('LogIn');
  };

  render() {
    const {email, invitationCode, pwd1, pwd2, step} = this.state;
    return (
      <Provider>
        <View style={styles.col}>
          {step === 0 && (
            <List renderHeader={''}>
              <InputItem
                value={email}
                onChange={e => {
                  this.setState({
                    email: e,
                  });
                }}
                placeholder="Email"
                type="email"
              />
              <InputItem
                value={invitationCode}
                onChange={e =>
                  this.setState({
                    invitationCode: e,
                  })
                }
                placeholder="Invitation Code"
              />
              <Button type="primary" onPress={() => this.register()}>
                <Text> Register </Text>
              </Button>
            </List>
          )}
          {step === 1 && (
            <List renderHeader={''}>
              <InputItem
                value={pwd1}
                onChange={e =>
                  this.setState({
                    pwd1: e,
                  })
                }
                placeholder="New Password"
                type="password"
              />
              <InputItem
                value={pwd2}
                onChange={e =>
                  this.setState({
                    pwd2: e,
                  })
                }
                placeholder="Repeat Password"
                type="password"
              />
              <Button type="primary" onPress={() => this.changePassword()}>
                <Text> Set Password </Text>
              </Button>
            </List>
          )}
        </View>
      </Provider>
    );
  }
}

export default withNavigation(Register);
