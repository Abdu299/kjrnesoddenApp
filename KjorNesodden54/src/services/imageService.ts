import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";

import {
  Platform,
} from "react-native";


// ==================================================
// MAX IMAGE SIZE
// ==================================================

// Firestore har maks ca. 1 MiB per dokument.
// Vi holder bildet godt under dette.
const MAX_IMAGE_SIZE = 650000;


// ==================================================
// PICK AND PREPARE IMAGE
// ==================================================

export async function pickAndPrepareImage():
Promise<string | null> {

  // ==================================================
  // PERMISSION - MOBILE ONLY
  // ==================================================

  if (Platform.OS !== "web") {

    const permission =
      await ImagePicker
        .requestMediaLibraryPermissionsAsync();


    if (!permission.granted) {

      throw new Error(
        "Du må gi appen tilgang til bilder."
      );
    }
  }


  // ==================================================
  // PICK IMAGE
  // ==================================================

  const result =
    await ImagePicker
      .launchImageLibraryAsync({

        mediaTypes: [
          "images",
        ],

        allowsEditing: false,

        quality: 0.7,

        // Viktig:
        // Vi ber ImagePicker om base64 også.
        // Da har vi en fallback hvis
        // ImageManipulator skulle feile.
        base64: true,
      });


  // ==================================================
  // USER CANCELLED
  // ==================================================

  if (result.canceled) {

    console.log(
      "Image selection cancelled"
    );

    return null;
  }


  const asset =
    result.assets?.[0];


  if (!asset) {

    throw new Error(
      "Kunne ikke lese bildet."
    );
  }


  console.log(
    "Selected image:",
    {
      uri:
        asset.uri,

      width:
        asset.width,

      height:
        asset.height,

      fileSize:
        asset.fileSize,

      hasBase64:
        !!asset.base64,
    }
  );


  // ==================================================
  // TRY TO RESIZE + COMPRESS
  // ==================================================

  try {

    const manipulatedImage =
      await ImageManipulator
        .manipulateAsync(

          asset.uri,

          [
            {
              resize: {
                width: 500,
              },
            },
          ],

          {
            compress: 0.35,

            format:
              ImageManipulator
                .SaveFormat
                .JPEG,

            base64: true,
          }
        );


    if (
      manipulatedImage.base64
    ) {

      const imageData =
        `data:image/jpeg;base64,${manipulatedImage.base64}`;


      console.log(
        "Compressed image size:",
        imageData.length
      );


      if (
        imageData.length >
        MAX_IMAGE_SIZE
      ) {

        throw new Error(
          "Bildet er for stort selv etter komprimering. Velg et mindre bilde."
        );
      }


      return imageData;
    }

  } catch (error: any) {

    console.log(
      "Image manipulation failed:",
      error
    );


    // Hvis bildet faktisk ble behandlet,
    // men fortsatt var for stort,
    // skal vi beholde den feilmeldingen.
    if (
      error?.message?.includes(
        "for stort"
      )
    ) {

      throw error;
    }
  }


  // ==================================================
  // FALLBACK
  //
  // Hvis ImageManipulator feiler,
  // bruker vi Base64 direkte fra ImagePicker.
  // ==================================================

  if (asset.base64) {

    const imageData =
      `data:image/jpeg;base64,${asset.base64}`;


    console.log(
      "Using ImagePicker Base64 fallback:",
      imageData.length
    );


    if (
      imageData.length >
      MAX_IMAGE_SIZE
    ) {

      throw new Error(
        "Bildet er for stort. Velg et mindre bilde."
      );
    }


    return imageData;
  }


  // ==================================================
  // NOTHING WORKED
  // ==================================================

  throw new Error(
    "Kunne ikke behandle bildet. Prøv et annet bilde."
  );
}