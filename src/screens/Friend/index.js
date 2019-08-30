import React from 'react';
import {ChatItem} from 'react-chat-elements/native';
import {
  StyleSheet,
  Image,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Linking,
} from 'react-native';
import {Header} from 'react-native-elements'
import {List} from '@ant-design/react-native';
import {withNavigation} from 'react-navigation';
import QRCodeScanner from 'react-native-qrcode-scanner';
import Icons from 'react-native-vector-icons/FontAwesome';

const Item = List.Item;
const Brief = Item.Brief;


class FriendList extends React.Component {

  render() {
    const {navigation} = this.props;
    return (
      <>
        <Header
          leftComponent={
            <Icons
              onPress={() => navigation.navigate('QrCode')}
              name="qrcode"
            />
          }
        />
        <ScrollView
          style={{flex: 1, backgroundColor: '#f5f5f9'}}
          automaticallyAdjustContentInsets={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}>
          <List renderHeader={'Friends'}>
            <Item
              onPress={() => {
                navigation.navigate('Chat', {
                  receiver: 'FuKTBcX8jUcQxg2FntSwx89GRmeXNCw5o6BjYmmEjWoV',
                });
              }}>
              <ChatItem
                avatar={'https://placeimg.com/140/140/any'}
                alt={'Reactjs'}
                title={'FuKTBcX8jUcQxg2FntSwx89GRmeXNCw5o6BjYmmEjWoV'}
                subtitle={''}
                date={new Date()}
                unread={0}
              />
            </Item>
            <Item onPress={() => console.log(2424)}>
              <ChatItem
                avatar={'https://placeimg.com/140/140/any'}
                alt={'Reactjs'}
                title={'Facebook'}
                subtitle={'What are you doing?'}
                date={new Date()}
                unread={2}
              />
            </Item>
            <Item>
              <ChatItem
                avatar={'https://placeimg.com/140/140/any'}
                alt={'Reactjs'}
                title={'ASTRI'}
                subtitle={'What is the weather like today?'}
                date={new Date()}
                unread={7}
              />
            </Item>
          </List>
        </ScrollView>
      </>
    );
  }
}
export default withNavigation(FriendList);
