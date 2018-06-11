/*For getting image of different sizes */ 
module.exports = function(grunt) {

  grunt.initConfig({
    responsive_images: {
      dev: {
        options: {
          engine: 'gm',
          sizes: [
          {
            width: 400,
            quality: 50
          },{
              width: 600,
              quality: 60
          
          }],
        },
        files: [{
          expand: true,
          src: ['*.{gif,jpg,png,webp}'],
          cwd: 'img/',
          dest: 'img/'
        }]
      }
    },
  });

  grunt.loadNpmTasks('grunt-responsive-images');
  grunt.registerTask('default', ['responsive_images']);

};
