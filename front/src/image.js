// image_name -> (x, y)
export function get_image(image_name) {

    console.log(image_name)

    if (image_name === "stone") {
        console.log("caught stone")
        return [-224, -992]
    }

    return [0, 0]
}