
cordova build --release android
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore android-release-key.keystore platforms/android/ant-build/RealEstateInvestmentCalculator-release-unsigned.apk RealEstateInvestmentCalculator
zipalign -v 4 platforms/android/ant-build/RealEstateInvestmentCalculator-release-unsigned.apk platforms/android/ant-build/RealEstateInvestmentCalculator.apk
cp platforms/android/ant-build/RealEstateInvestmentCalculator.apk RealEstateInvestmentCalculator.apk

