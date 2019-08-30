/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
//delete GLOBAL.XMLHttpRequest;
AppRegistry.registerComponent(appName, () => App);
