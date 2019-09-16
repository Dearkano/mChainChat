import {
    Linking,
    Alert
} from 'react-native'
//import Location from 'react-native-location'
import Permissions from 'react-native-permissions'
import ImagePicker from 'react-native-image-picker'
console.log(Permissions)
export default async function getPermissionAsync(permission) {
    console.log(permission)
    console.log(Permissions)
    const status = await Permissions.check(permission)
    if (status !== 'authorized') {
        const permissionName = permission.toLowerCase().replace('_', ' ')
        Alert.alert(
            'Cannot be done 😞',
            `If you would like to use this feature, you'll need to enable the ${permissionName} permission in your phone settings.`,
            [{
                    text: "Let's go!",
                    onPress: () => Linking.openURL('app-settings:'),
                },
                {
                    text: 'Nevermind',
                    onPress: () => {},
                    style: 'cancel'
                },
            ], {
                cancelable: true
            },
        )

        return false
    }
    return true
}

// export async function getLocationAsync(onSend) {
//     if (await getPermissionAsync('location')) {
//         const location = await Location.getCurrentPositionAsync({})
//         if (location) {
//             onSend([{
//                 location: location.coords
//             }])
//         }
//     }
// }

export async function pickImageAsync(onSend) {
    if (await getPermissionAsync('photo')) {
        // const result = await ImagePicker.launchImageLibraryAsync({
        //     allowsEditing: true,
        //     aspect: [4, 3],
        // })

        // if (!result.cancelled) {
        //     onSend([{
        //         image: result.uri
        //     }])
        //     return result.uri
        // }

        ImagePicker.showImagePicker(null, (response) => {
            console.log('Response = ', response);

            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
            } else if (response.customButton) {
                console.log('User tapped custom button: ', response.customButton);
            } else {
                const source = {
                    uri: response.uri,
                    file: response
                };
                onSend([source])
            }
        });
    }
}

export async function takePictureAsync(onSend) {
    if (await getPermissionAsync('camera')) {
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
        })

        if (!result.cancelled) {
            onSend([{
                image: result.uri
            }])
            return result.uri
        }
    }
}