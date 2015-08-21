# Sector

This is an abstraction of a multi-resolution grid where sectors are divided into regular n x n 
grids of square sub-sectors. Each sub-sector's span (width and height) 
is its parents' span, divided by the size (n) that the parent was cut up into.
 
Sectors can be divided recursively as many times as you want. 

Each sector has: 

* an i and j index ranging from 0... size
* a size (how many sectors its parent was cut up into
* content - an arbitrary value/object 

## Span (width and height)

Parent (root) sectors have a defined span (absolute width and height). 
All other sectors' spans are calculated based on the span of their parents. 

## Leaves (virtual sectors

At the smallest (leaf) size, the sectors are represented in an array of 
content called leaves. Leaf sectors are dynamically generated out of this array
but are not registered; that is, they aren't stored in the database as 
individual records, but rather their contetns are stored as 
a property of their parent. 

## Example

``` javascript

(if in node)
var Sector = require('./Sector').Sector;

var parent = new Sector({span: 100});
parent.divide(4);

var firstChild = parent.childAt(0,0);

console.log('first child offset: ', firstChild.offset()); // {i: 0, j: 0};

var child11 = parent.childAt(1, 1);

console.log('child at 1, 1 offset: ', child11.offset()); // {i: 25, J: 25};

child11.divide(2);

var child11_11 = child11.childAt(1,1);

console.log('child at (1,1)(1,1) offset: ', child11_11.offset()); // { i: 37.5, j: 37.5 }

```