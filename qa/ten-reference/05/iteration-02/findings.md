# Second actual GPU render: local comparison

`corner-comparison.png` places the original on the left and actual render on the right. Neither global nor local appearance is accepted. The second render corrected radial fan rafters, but its end surfaces washed out, metal lantern body was still sealed, thin smooth repetitive brackets lacked the original massive carved joinery, and branches read as straight rods.

Material audit found that wood roughness was multiplied by the gray height texture. A base roughness near .6 therefore became approximately .25–.35, allowing broad white dielectric highlights on exposed caps. Revision three removes that roughness texture from wood, sets rough local timber finishes, and restricts wood environment reflection. Gold retains a separate metal finish. No global yellow cast was applied.

Revision three adds thinner denser rafter sections, exposed gilded caps on both staggered layers, larger diagonal bearing timbers, midpoint bracket sets sharing the post-capital bearing datum, carved leaf-and-vine friezes, and cast lobed railing finials. Procedural grain, wear, splits and roughness are visible at local timber scale.

The lantern is rebuilt from distinct closed hood/bowl shells, six narrow corner jambs, paper panes and curved metal tracery, a genuinely pierced six-sided crown, rings, suspension and pendant. There is no solid cylinder behind the panes.

The maple uses continuously curved tapering tubes with three generations of attached forks and 9,945 individually lobed small leaves. Its live branches grow through each leaf spray; the straight crossing bars were removed.

Pending: third real GPU render to test those changes, especially the white end highlight diagnosis and ornament scale. CPU construction and syntax do not establish appearance quality.
