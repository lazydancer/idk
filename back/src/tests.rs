#[cfg(test)]
mod tests {

use crate::inventory::Inventory;

#[test]
fn it_works() {

	let inv = Inventory::init();

	let result = 2 + 2;
	assert_eq!(result, 4);
} 
}
