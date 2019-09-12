import React from 'react';
import {Button, InputItem, List, TextareaItem} from '@ant-design/react-native';
import {withNavigation} from 'react-navigation';
import {
  StyleSheet,
  Image,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import bs58 from 'bs58';
import {Buffer} from 'buffer';
import sha256 from 'sha256';
import g from '../../state';
const config = require('../../config.json')
const afshost = config.bos;

const styles = StyleSheet.create({
  col: {
    flex: 1,
    flexDirection: 'column',
    // alignItems: 'center', // this will prevent TFs from stretching horizontal
    marginLeft: 7,
    marginRight: 7,
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
});

class AddFriend extends React.Component {
  state = {
    remark: '',
    receiver: '',
    receiverPublicKey: '',
  };
  componentWillMount() {
    const receiverPublicKey = this.props.navigation.getParam(
      'receiverPublicKey',
    );
    const hash = sha256.x2(receiverPublicKey);
    const receiver = bs58.encode(Buffer.from(hash, 'hex'));
    this.setState({
      receiver,
      receiverPublicKey,
    });
  }
  submit = async () => {
    const {remark, receiver, receiverPublicKey} = this.state;
    await g.addFriend({
      addr: receiver,
      remark,
    });
    this.props.navigation.navigate('Friend');
    // get Previous Friend List AFID by tag
    // const res1 = await fetch(`${afshost}/`)
  };
  render() {
    const {remark, receiver, receiverPublicKey} = this.state;
    return (
      <View style={styles.col}>
        <List renderHeader={''}>
          <TextareaItem
            rows={3}
            value={receiver}
            editable={false}
            placeholder="Addr"
          />
          <InputItem
            value={remark}
            onChange={e => this.setState({remark: e})}
            placeholder="Remark"
          />
          <Button type="primary" onPress={() => this.submit()}>
            <Text> Add Friend </Text>
          </Button>
        </List>
      </View>
    );
  }
}

export default withNavigation(AddFriend);
