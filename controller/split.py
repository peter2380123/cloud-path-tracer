#!/usr/bin/python
import math

S = 100
W = 200
H = 100
B = 3

N = math.ceil((W * H * B) / S)

# Change here to see how changing this policy changes the area we cover.
n = math.ceil(math.sqrt((H**2) / N))
m = math.ceil((W * n) / H)

print("N: {}, m: {}, n: {}".format(N, m, n))

W_on_m = W/m
H_on_n = H/n

print("W/m = {}".format(W_on_m))
print("H/n = {}".format(H_on_n))

print("Area covered: {}, total area: {}".format(m * n * N, W*H))
