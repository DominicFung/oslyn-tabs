module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      "nativewind/babel",
      // ['module-resolver',
      //   {
      //     extensions: [".ts", ".d.ts"],
      //     alias: {
      //       '@core': './../core',
      //       '@src': './../src'
      //     },
      //   }
      // ]
    ],
  };
};
